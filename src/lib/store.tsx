import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSeed } from "./seed";
import type { Activity, ActivityType, DataState, Milestone, BomPart, Member, Task, FileItem } from "./types";
import { uid } from "./format";
import { clearConfig, clientSummary, getClient, saveConfig, type SupabaseConfig } from "./supabase";
import {
  clearAll as clearAllRemote,
  loadAll,
  resetToSeed as resetToSeedRemote,
  syncDiff,
  testConnection,
  type ConnectionResult,
  type TableStat,
} from "./backend";

const DATA_KEY = "bp18.dashboard.v2";
const THEME_KEY = "bp18.theme.v1";

export interface Toast {
  id: string;
  message: string;
  tone: "ok" | "warn" | "danger" | "info";
}

export type BackendMode = "supabase" | "local";

export interface BackendStatus {
  mode: BackendMode;
  configured: boolean;
  connecting: boolean;
  connected: boolean;
  schemaReady: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
  latencyMs: number | null;
  rowCounts: TableStat[] | null;
  configSummary: { url: string; keyTail: string } | null;
}

const IDLE: BackendStatus = {
  mode: "local",
  configured: false,
  connecting: false,
  connected: false,
  schemaReady: false,
  lastSyncAt: null,
  lastError: null,
  latencyMs: null,
  rowCounts: null,
  configSummary: null,
};

interface StoreCtx {
  state: DataState;
  theme: "dark" | "light";
  toggleTheme: () => void;
  toasts: Toast[];
  pushToast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;
  addTask: (t: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addBom: (p: Omit<BomPart, "id">) => void;
  updateBom: (id: string, patch: Partial<BomPart>) => void;
  deleteBom: (id: string) => void;
  addMember: (m: Omit<Member, "id">) => void;
  updateMember: (id: string, patch: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  addFile: (f: Omit<FileItem, "id">) => void;
  deleteFile: (id: string) => void;
  addMilestone: (m: Omit<Milestone, "id">) => void;
  updateMilestone: (id: string, patch: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
  resetData: () => void;
  clearData: () => void;
  exportJson: () => string;
  importJson: (raw: string) => boolean;
  backend: BackendStatus;
  connect: (cfg: SupabaseConfig) => Promise<ConnectionResult | null>;
  disconnect: () => void;
  refresh: () => Promise<void>;
  testBackend: () => Promise<ConnectionResult | null>;
}

const Ctx = createContext<StoreCtx | null>(null);

function load(): DataState {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DataState;
      if (parsed && parsed.project && Array.isArray(parsed.tasks)) return parsed;
    }
  } catch {
    /* corrupted store -> reseed */
  }
  return buildSeed();
}

function loadTheme(): "dark" | "light" {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === "light" || t === "dark") return t;
  } catch {
    /* ignore */
  }
  return "dark";
}

function errorMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return String(e);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>(load);
  const [theme, setTheme] = useState<"dark" | "light">(loadTheme);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [backend, setBackend] = useState<BackendStatus>(() => {
    const sb = getClient();
    return { ...IDLE, configured: Boolean(sb), mode: sb ? "supabase" : "local" };
  });

  const timers = useRef<Map<string, number>>(new Map());
  const clientRef = useRef<SupabaseClient | null>(null);
  const modeRef = useRef<BackendMode>("local");
  const prevRef = useRef<DataState | null>(null);
  const skipSyncRef = useRef(0);

  const setMode = useCallback((mode: BackendMode) => {
    modeRef.current = mode;
    setBackend((b) => ({ ...b, mode }));
  }, []);

  /* ---------- toasts ---------- */

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    (message: string, tone: Toast["tone"] = "ok") => {
      const id = uid();
      setToasts((t) => [...t.slice(-3), { id, message, tone }]);
      const timer = window.setTimeout(() => dismissToast(id), 4200);
      timers.current.set(id, timer);
    },
    [dismissToast]
  );

  /* ---------- local mirror (always, so the app works offline) ---------- */

  useEffect(() => {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked */
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  /* ---------- remote sync (diff-based, optimistic) ---------- */

  useEffect(() => {
    if (skipSyncRef.current > 0) {
      skipSyncRef.current -= 1;
      prevRef.current = state;
      return;
    }
    const sb = clientRef.current;
    if (modeRef.current === "supabase" && sb && prevRef.current) {
      syncDiff(sb, prevRef.current, state)
        .then(() =>
          setBackend((b) => ({ ...b, lastSyncAt: new Date().toISOString(), lastError: null, connected: true }))
        )
        .catch((e) => {
          setBackend((b) => ({ ...b, lastError: errorMessage(e), connected: false }));
          pushToast("Sync failed — " + errorMessage(e), "danger");
        });
    }
    prevRef.current = state;
  }, [state, pushToast]);

  /* ---------- hydrate on mount when a config already exists ---------- */

  useEffect(() => {
    if (!backend.configured) return;
    const sb = getClient();
    if (!sb) return;
    let cancelled = false;
    setBackend((b) => ({ ...b, connecting: true, lastError: null }));
    loadAll(sb)
      .then((loaded) => {
        if (cancelled) return;
        clientRef.current = sb;
        setMode("supabase");
        skipSyncRef.current += 1;
        setState(loaded);
        prevRef.current = loaded;
        setBackend((b) => ({
          ...b,
          connecting: false,
          connected: true,
          schemaReady: true,
          lastSyncAt: new Date().toISOString(),
          configSummary: clientSummary(sb),
        }));
      })
      .catch((e) => {
        if (cancelled) return;
        setMode("local");
        setBackend((b) => ({
          ...b,
          connecting: false,
          connected: false,
          lastError: errorMessage(e),
          configSummary: clientSummary(sb),
        }));
        pushToast("Supabase unreachable — local mode", "warn");
      });
    return () => {
      cancelled = true;
    };
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- mutations ---------- */

  const log = useCallback((message: string, type: ActivityType, actorId = "") => {
    const entry: Activity = { id: uid(), message, type, actorId, timestamp: new Date().toISOString() };
    setState((s) => ({ ...s, activity: [entry, ...s.activity].slice(0, 120) }));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const addTask = useCallback(
    (t: Omit<Task, "id" | "createdAt">) => {
      const task: Task = { ...t, id: uid(), createdAt: new Date().toISOString() };
      setState((s) => ({ ...s, tasks: [task, ...s.tasks] }));
      log(`Task created: ${task.title}`, "task");
      pushToast("Task created", "ok");
    },
    [log, pushToast]
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
      if (patch.status === "done") log(`Task completed: ${patch.title ?? id}`, "approve");
      else log(`Task updated: ${patch.title ?? id}`, "task");
      pushToast("Task updated", "ok");
    },
    [log, pushToast]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
      log(`Task deleted: ${id}`, "error");
      pushToast("Task deleted", "danger");
    },
    [log, pushToast]
  );

  const addBom = useCallback(
    (p: Omit<BomPart, "id">) => {
      const part: BomPart = { ...p, id: uid() };
      setState((s) => ({ ...s, bom: [part, ...s.bom] }));
      log(`BOM part added: ${part.partName} (${part.partNumber})`, "bom");
      pushToast("Part added to BOM", "ok");
    },
    [log, pushToast]
  );

  const updateBom = useCallback(
    (id: string, patch: Partial<BomPart>) => {
      setState((s) => ({ ...s, bom: s.bom.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
      log(`BOM part updated: ${patch.partName ?? id}`, "bom");
      pushToast("BOM updated", "ok");
    },
    [log, pushToast]
  );

  const deleteBom = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, bom: s.bom.filter((b) => b.id !== id) }));
      log(`BOM part removed: ${id}`, "error");
      pushToast("Part removed", "danger");
    },
    [log, pushToast]
  );

  const addMember = useCallback(
    (m: Omit<Member, "id">) => {
      const member: Member = { ...m, id: uid() };
      setState((s) => ({ ...s, members: [...s.members, member] }));
      log(`Member added: ${member.name}`, "member");
      pushToast("Member added", "ok");
    },
    [log, pushToast]
  );

  const updateMember = useCallback(
    (id: string, patch: Partial<Member>) => {
      setState((s) => ({ ...s, members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
      log(`Member updated: ${patch.name ?? id}`, "member");
      pushToast("Member updated", "ok");
    },
    [log, pushToast]
  );

  const deleteMember = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, members: s.members.filter((m) => m.id !== id) }));
      log(`Member removed: ${id}`, "error");
      pushToast("Member removed", "danger");
    },
    [log, pushToast]
  );

  const addFile = useCallback(
    (f: Omit<FileItem, "id">) => {
      const file: FileItem = { ...f, id: uid() };
      setState((s) => ({ ...s, files: [file, ...s.files] }));
      log(`Uploaded ${file.name}`, "upload");
      pushToast("File added", "ok");
    },
    [log, pushToast]
  );

  const deleteFile = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, files: s.files.filter((f) => f.id !== id) }));
      log(`File deleted: ${id}`, "error");
      pushToast("File removed", "danger");
    },
    [log, pushToast]
  );

  const addMilestone = useCallback(
    (m: Omit<Milestone, "id">) => {
      const ms: Milestone = { ...m, id: uid() };
      setState((s) => ({ ...s, milestones: [...s.milestones, ms] }));
      log(`Milestone added: ${ms.name}`, "milestone");
      pushToast("Milestone added", "ok");
    },
    [log, pushToast]
  );

  const updateMilestone = useCallback(
    (id: string, patch: Partial<Milestone>) => {
      setState((s) => ({
        ...s,
        milestones: s.milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      }));
      log(`Milestone updated: ${patch.name ?? id}`, "milestone");
      pushToast("Milestone updated", "ok");
    },
    [log, pushToast]
  );

  const deleteMilestone = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, milestones: s.milestones.filter((m) => m.id !== id) }));
      log(`Milestone deleted: ${id}`, "error");
      pushToast("Milestone deleted", "danger");
    },
    [log, pushToast]
  );

  /* ---------- data lifecycle ---------- */

  const resetData = useCallback(() => {
    const sb = clientRef.current;
    if (modeRef.current === "supabase" && sb) {
      setBackend((b) => ({ ...b, connecting: true, lastError: null }));
      resetToSeedRemote(sb)
        .then((seed) => {
          skipSyncRef.current += 1;
          setState(seed);
          prevRef.current = seed;
          pushToast("Database reset to seed data", "ok");
        })
        .catch((e) => pushToast("Reset failed — " + errorMessage(e), "danger"))
        .finally(() =>
          setBackend((b) => ({ ...b, connecting: false, lastSyncAt: new Date().toISOString() }))
        );
      return;
    }
    skipSyncRef.current += 1;
    const seed = buildSeed();
    setState(seed);
    prevRef.current = seed;
    pushToast("Demo data reset", "info");
  }, [pushToast]);

  const clearData = useCallback(() => {
    const empty: DataState = {
      project: buildSeed().project,
      members: [],
      tasks: [],
      bom: [],
      milestones: [],
      files: [],
      activity: [],
    };
    const sb = clientRef.current;
    if (modeRef.current === "supabase" && sb) {
      setBackend((b) => ({ ...b, connecting: true, lastError: null }));
      clearAllRemote(sb)
        .then(() => {
          skipSyncRef.current += 1;
          setState(empty);
          prevRef.current = empty;
          pushToast("All data cleared", "ok");
        })
        .catch((e) => pushToast("Clear failed — " + errorMessage(e), "danger"))
        .finally(() =>
          setBackend((b) => ({ ...b, connecting: false, lastSyncAt: new Date().toISOString() }))
        );
      return;
    }
    skipSyncRef.current += 1;
    setState(empty);
    prevRef.current = empty;
    pushToast("All data cleared", "ok");
  }, [pushToast]);

  const exportJson = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importJson = useCallback(
    (raw: string) => {
      try {
        const parsed = JSON.parse(raw) as DataState;
        if (!parsed || !parsed.project || !Array.isArray(parsed.tasks)) {
          pushToast("Invalid data file", "danger");
          return false;
        }
        skipSyncRef.current += 1;
        setState(parsed);
        prevRef.current = parsed;
        pushToast("Data imported", "ok");
        return true;
      } catch {
        pushToast("Could not parse JSON", "danger");
        return false;
      }
    },
    [pushToast]
  );

  /* ---------- backend controls ---------- */

  const testBackend = useCallback(async () => {
    const sb = clientRef.current ?? getClient();
    if (!sb) {
      pushToast("No Supabase connection configured", "warn");
      return null;
    }
    const result = await testConnection(sb);
    setBackend((b) => ({
      ...b,
      latencyMs: result.latencyMs,
      schemaReady: result.schemaReady,
      lastError: result.error ?? null,
      rowCounts: result.rowCounts ?? b.rowCounts,
    }));
    return result;
  }, [pushToast]);

  const connect = useCallback(
    async (cfg: SupabaseConfig) => {
      saveConfig(cfg);
      const sb = getClient();
      if (!sb) {
        setBackend((b) => ({ ...b, configured: false, mode: "local", lastError: "Could not create client" }));
        return null;
      }
      clientRef.current = sb;
      setBackend((b) => ({
        ...b,
        connecting: true,
        configured: true,
        mode: "supabase",
        lastError: null,
        configSummary: clientSummary(sb),
      }));
      try {
        const probe = await testConnection(sb);
        setBackend((b) => ({
          ...b,
          latencyMs: probe.latencyMs,
          schemaReady: probe.schemaReady,
          rowCounts: probe.rowCounts ?? null,
          lastError: probe.error ?? null,
        }));
        if (!probe.ok) {
          setMode("local");
          setBackend((b) => ({ ...b, connecting: false, connected: false }));
          pushToast("Connection failed — " + (probe.error ?? "unknown"), "danger");
          return probe;
        }
        if (!probe.schemaReady) {
          pushToast("Connected, but the schema is missing — run supabase/schema.sql", "warn");
        }
        const loaded = await loadAll(sb);
        skipSyncRef.current += 1;
        setMode("supabase");
        setState(loaded);
        prevRef.current = loaded;
        setBackend((b) => ({
          ...b,
          connecting: false,
          connected: true,
          lastSyncAt: new Date().toISOString(),
        }));
        pushToast(probe.schemaReady ? "Connected to Supabase" : "Connected — schema incomplete", "ok");
        return probe;
      } catch (e) {
        setMode("local");
        setBackend((b) => ({ ...b, connecting: false, connected: false, lastError: errorMessage(e) }));
        pushToast("Connection failed — " + errorMessage(e), "danger");
        return null;
      }
    },
    [pushToast, setMode]
  );

  const disconnect = useCallback(() => {
    clearConfig();
    clientRef.current = null;
    setMode("local");
    setBackend({ ...IDLE, configured: false, mode: "local", configSummary: null });
    pushToast("Disconnected — local mode", "info");
  }, [pushToast, setMode]);

  const refresh = useCallback(async () => {
    const sb = clientRef.current ?? getClient();
    if (!sb) {
      pushToast("No Supabase connection configured", "warn");
      return;
    }
    setBackend((b) => ({ ...b, connecting: true, lastError: null }));
    try {
      const loaded = await loadAll(sb);
      skipSyncRef.current += 1;
      clientRef.current = sb;
      setMode("supabase");
      setState(loaded);
      prevRef.current = loaded;
      setBackend((b) => ({
        ...b,
        connecting: false,
        connected: true,
        lastSyncAt: new Date().toISOString(),
        configSummary: clientSummary(sb),
      }));
      pushToast("Data refreshed", "ok");
    } catch (e) {
      setBackend((b) => ({ ...b, connecting: false, lastError: errorMessage(e) }));
      pushToast("Refresh failed — " + errorMessage(e), "danger");
    }
  }, [pushToast, setMode]);

  const value = useMemo<StoreCtx>(
    () => ({
      state,
      theme,
      toggleTheme,
      toasts,
      pushToast,
      dismissToast,
      addTask,
      updateTask,
      deleteTask,
      addBom,
      updateBom,
      deleteBom,
      addMember,
      updateMember,
      deleteMember,
      addFile,
      deleteFile,
      addMilestone,
      updateMilestone,
      deleteMilestone,
      resetData,
      clearData,
      exportJson,
      importJson,
      backend,
      connect,
      disconnect,
      refresh,
      testBackend,
    }),
    [
      state,
      theme,
      toggleTheme,
      toasts,
      pushToast,
      dismissToast,
      addTask,
      updateTask,
      deleteTask,
      addBom,
      updateBom,
      deleteBom,
      addMember,
      updateMember,
      deleteMember,
      addFile,
      deleteFile,
      addMilestone,
      updateMilestone,
      deleteMilestone,
      resetData,
      clearData,
      exportJson,
      importJson,
      backend,
      connect,
      disconnect,
      refresh,
      testBackend,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
