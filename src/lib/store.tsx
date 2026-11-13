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
import { buildSeed } from "./seed";
import type { Activity, ActivityType, DataState, Milestone, BomPart, Member, Task, FileItem } from "./types";
import { uid } from "./format";

const DATA_KEY = "bp18.dashboard.v2";
const THEME_KEY = "bp18.theme.v1";

export interface Toast {
  id: string;
  message: string;
  tone: "ok" | "warn" | "danger" | "info";
}

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
  exportJson: () => string;
  importJson: (raw: string) => boolean;
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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>(load);
  const [theme, setTheme] = useState<"dark" | "light">(loadTheme);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

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
      const id = uid("toast");
      setToasts((t) => [...t.slice(-3), { id, message, tone }]);
      const timer = window.setTimeout(() => dismissToast(id), 4200);
      timers.current.set(id, timer);
    },
    [dismissToast]
  );

  const log = useCallback((message: string, type: ActivityType, actorId = "m1") => {
    const entry: Activity = { id: uid("a"), message, type, actorId, timestamp: new Date().toISOString() };
    setState((s) => ({ ...s, activity: [entry, ...s.activity].slice(0, 120) }));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const addTask = useCallback(
    (t: Omit<Task, "id" | "createdAt">) => {
      const task: Task = { ...t, id: uid("t"), createdAt: new Date().toISOString() };
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
      const part: BomPart = { ...p, id: uid("b") };
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
      const member: Member = { ...m, id: uid("m") };
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
      const file: FileItem = { ...f, id: uid("f") };
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
      const ms: Milestone = { ...m, id: uid("ms") };
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

  const resetData = useCallback(() => {
    const seed = buildSeed();
    setState(seed);
    pushToast("Demo data reset", "info");
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
        setState(parsed);
        pushToast("Data imported", "ok");
        return true;
      } catch {
        pushToast("Could not parse JSON", "danger");
        return false;
      }
    },
    [pushToast]
  );

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
      exportJson,
      importJson,
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
      exportJson,
      importJson,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
