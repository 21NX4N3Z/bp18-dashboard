import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { useStore } from "../lib/store";
import { STATUS_TONE } from "../lib/format";
import { Badge, IconButton, Switch } from "./ui";
import {
  IconActivity,
  IconCalendar,
  IconChart,
  IconCheckSquare,
  IconChevronRight,
  IconCommand,
  IconDatabase,
  IconDownload,
  IconFile,
  IconGrid,
  IconLayers,
  IconMenu,
  IconMoon,
  IconRefresh,
  IconSearch,
  IconSun,
  IconTv,
  IconUpload,
  IconUsers,
  IconX,
} from "./icons";

export type PageId = "overview" | "tasks" | "bom" | "analytics" | "members" | "files" | "milestones";

export const PAGE_META: Record<PageId, { title: string; crumb: string; section: string }> = {
  overview: { title: "Overview", crumb: "CONTROL / OVERVIEW", section: "Control" },
  tasks: { title: "Tasks", crumb: "CONTROL / TASKS", section: "Control" },
  bom: { title: "Bill of Materials", crumb: "ENGINEERING / BOM", section: "Engineering" },
  analytics: { title: "Analytics", crumb: "ENGINEERING / ANALYTICS", section: "Engineering" },
  members: { title: "Team", crumb: "ENGINEERING / TEAM", section: "Engineering" },
  files: { title: "Files", crumb: "ENGINEERING / FILES", section: "Engineering" },
  milestones: { title: "Milestones", crumb: "CONTROL / MILESTONES", section: "Control" },
};

export const NAV: { id: PageId; label: string; icon: (p: { size?: number }) => ReactElement }[] = [
  { id: "overview", label: "Overview", icon: (p) => <IconGrid {...p} /> },
  { id: "tasks", label: "Tasks", icon: (p) => <IconCheckSquare {...p} /> },
  { id: "milestones", label: "Milestones", icon: (p) => <IconCalendar {...p} /> },
  { id: "bom", label: "BOM", icon: (p) => <IconLayers {...p} /> },
  { id: "analytics", label: "Analytics", icon: (p) => <IconChart {...p} /> },
  { id: "members", label: "Team", icon: (p) => <IconUsers {...p} /> },
  { id: "files", label: "Files", icon: (p) => <IconFile {...p} /> },
];

/* ================= Sidebar ================= */

export function Sidebar({
  page,
  onNavigate,
  open,
  onClose,
}: {
  page: PageId;
  onNavigate: (p: PageId) => void;
  open: boolean;
  onClose: () => void;
}) {
  const { state, theme, toggleTheme, pushToast } = useStore();
  const openTasks = state.tasks.filter((t) => t.status !== "done").length;
  const crit = state.tasks.filter((t) => t.priority === "critical" && t.status !== "done").length;
  const qcFail = state.bom.filter((b) => b.vendorStatus === "qc_failed").length;

  return (
    <>
      {open ? <div className="modal-overlay" style={{ zIndex: 35 }} onMouseDown={onClose} /> : null}
      <aside className={"sidebar" + (open ? " sidebar-open" : "")} aria-label="Primary">
        <div className="sidebar-brand">
          <div className="brand-mark" aria-hidden="true">
            <IconActivity size={22} />
          </div>
          <div className="brand-text">
            <div className="brand-name">BP18</div>
            <div className="brand-sub">F&amp;B CONTROL</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Control</div>
          {NAV.filter((n) => ["overview", "tasks", "milestones"].includes(n.id)).map((n) => (
            <NavButton
              key={n.id}
              active={page === n.id}
              onClick={() => {
                onNavigate(n.id);
                onClose();
              }}
              icon={n.icon({ size: 18 })}
              label={n.label}
              badge={n.id === "tasks" && crit > 0 ? String(crit) : undefined}
              alert={n.id === "tasks" && crit > 0}
            />
          ))}

          <div className="nav-section">Engineering</div>
          {NAV.filter((n) => !["overview", "tasks", "milestones"].includes(n.id)).map((n) => (
            <NavButton
              key={n.id}
              active={page === n.id}
              onClick={() => {
                onNavigate(n.id);
                onClose();
              }}
              icon={n.icon({ size: 18 })}
              label={n.label}
              badge={n.id === "bom" && qcFail > 0 ? String(qcFail) : undefined}
              alert={n.id === "bom" && qcFail > 0}
            />
          ))}
        </nav>

        <div className="sidebar-foot">
          <Switch
            checked={theme === "dark"}
            onChange={() => {
              toggleTheme();
              pushToast(theme === "dark" ? "Light theme" : "Dark theme", "info");
            }}
            label="Dark theme"
            description={theme === "dark" ? "Machine dark" : "Daylight"}
          />
          <div className="sidebar-foot-row">
            <span className="badge badge-dim">
              <IconDatabase size={12} strokeWidth={2.2} />
              LOCAL STORE
            </span>
            <span className="badge badge-ok">
              <IconCheckSquare size={12} strokeWidth={2.2} />
              {state.tasks.length} TASKS
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
  badge,
  alert,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactElement;
  label: string;
  badge?: string;
  alert?: boolean;
}) {
  return (
    <button
      className={"nav-link" + (active ? " nav-link-active" : "")}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      <span className="nav-icon">{icon}</span>
      {label}
      {badge ? <span className={"nav-badge" + (alert ? " nav-badge-alert" : "")}>{badge}</span> : null}
    </button>
  );
}

/* ================= Topbar ================= */

export function Topbar({
  page,
  onOpenPalette,
  onToggleSidebar,
  onOpenTv,
  onNavigate,
}: {
  page: PageId;
  onOpenPalette: () => void;
  onToggleSidebar: () => void;
  onOpenTv: () => void;
  onNavigate: (p: PageId) => void;
}) {
  const { theme, toggleTheme, state, resetData, exportJson, importJson, pushToast } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const meta = PAGE_META[page];

  function download() {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bp18-dashboard-data.json";
    a.click();
    URL.revokeObjectURL(url);
    pushToast("Data exported", "info");
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importJson(String(reader.result ?? ""));
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <header className="topbar">
      <IconButton label="Open navigation" className="menu-btn" onClick={onToggleSidebar}>
        <IconMenu size={20} />
      </IconButton>

      <div style={{ minWidth: 0 }}>
        <h1 className="topbar-title">{meta.title}</h1>
      </div>
      <span className="topbar-crumb">{meta.crumb}</span>

      <div className="topbar-spacer" />

      <div className="topbar-meta">
        <span className="status-dot" aria-hidden="true" />
        <span>LOCAL</span>
        <span className="mono">
          {clock.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>

      <button className="icon-btn" onClick={onOpenPalette} aria-label="Open command palette" title="Command palette (Ctrl+K)">
        <IconSearch size={18} />
      </button>

      <IconButton
        label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        onClick={toggleTheme}
      >
        {theme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
      </IconButton>

      <IconButton label="Open TV mode" onClick={onOpenTv}>
        <IconTv size={18} />
      </IconButton>

      <div style={{ position: "relative" }}>
        <IconButton label="Data menu" onClick={() => setMenuOpen((v) => !v)}>
          <IconDatabase size={18} />
        </IconButton>
        {menuOpen ? (
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 60 }}
              onMouseDown={() => setMenuOpen(false)}
            />
            <div
              role="menu"
              aria-label="Data menu"
              style={{
                position: "absolute",
                right: 0,
                top: 48,
                width: 240,
                zIndex: 61,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                boxShadow: "var(--shadow)",
                padding: 8,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <button
                className="palette-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  download();
                }}
              >
                <IconDownload size={18} />
                Export JSON
              </button>
              <button
                className="palette-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  fileRef.current?.click();
                }}
              >
                <IconUpload size={18} />
                Import JSON
              </button>
              <button
                className="palette-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  resetData();
                }}
              >
                <IconRefresh size={18} />
                Reset demo data
              </button>
              <div className="palette-empty" style={{ padding: "8px 12px" }}>
                <span className="mono" style={{ fontSize: 11 }}>
                  {state.tasks.length} TASKS · {state.bom.length} PARTS · {state.members.length} MEMBERS
                </span>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <input ref={fileRef} type="file" accept="application/json" className="sr-only" onChange={onImportFile} />

      <button className="btn btn-primary btn-sm" onClick={() => onNavigate("tasks")}>
        <IconCheckSquare size={16} />
        New task
      </button>
    </header>
  );
}

/* ================= Command palette ================= */

interface Cmd {
  id: string;
  label: string;
  hint?: string;
  icon: ReactElement;
  run: () => void;
  kbd?: string;
}

export function CommandPalette({
  open,
  onClose,
  onNavigate,
  onOpenTv,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (p: PageId) => void;
  onOpenTv: () => void;
}) {
  const { state, theme, toggleTheme, resetData, exportJson, pushToast } = useStore();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Cmd[]>(() => {
    const list: Cmd[] = NAV.map((n) => ({
      id: "nav-" + n.id,
      label: "Go to " + n.label,
      hint: PAGE_META[n.id].crumb,
      icon: <IconChevronRight size={18} />,
      run: () => onNavigate(n.id),
    }));
    list.push({
      id: "tv",
      label: "Open TV mode",
      hint: "Workshop display",
      icon: <IconTv size={18} />,
      run: onOpenTv,
    });
    list.push({
      id: "theme",
      label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
      hint: "Appearance",
      icon: theme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />,
      run: toggleTheme,
    });
    list.push({
      id: "export",
      label: "Export data as JSON",
      hint: "Download backup",
      icon: <IconDownload size={18} />,
      run: () => {
        const blob = new Blob([exportJson()], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "bp18-dashboard-data.json";
        a.click();
        URL.revokeObjectURL(url);
        pushToast("Data exported", "info");
      },
    });
    list.push({
      id: "reset",
      label: "Reset demo data",
      hint: "Restore seed dataset",
      icon: <IconRefresh size={18} />,
      run: resetData,
    });
    for (const t of state.tasks) {
      list.push({
        id: "task-" + t.id,
        label: t.title,
        hint: "Task · " + t.status,
        icon: <IconCheckSquare size={18} />,
        run: () => onNavigate("tasks"),
      });
    }
    for (const b of state.bom) {
      list.push({
        id: "bom-" + b.id,
        label: b.partName,
        hint: "Part · " + b.partNumber,
        icon: <IconLayers size={18} />,
        run: () => onNavigate("bom"),
      });
    }
    return list;
  }, [state.tasks, state.bom, theme, toggleTheme, resetData, exportJson, onNavigate, onOpenTv, pushToast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands.slice(0, 14);
    return commands
      .filter((c) => c.label.toLowerCase().includes(q) || (c.hint ?? "").toLowerCase().includes(q))
      .slice(0, 14);
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
    }
  }, [open]);

  useEffect(() => setIndex(0), [query]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  function run(cmd: Cmd) {
    onClose();
    cmd.run();
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="modal palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        style={{ width: 640 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--border)" }}>
          <span style={{ paddingLeft: 20, color: "var(--text-3)" }}>
            <IconCommand size={20} />
          </span>
          <input
            className="palette-input"
            placeholder="Type a command or search..."
            value={query}
            autoFocus
            aria-label="Command search"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => Math.min(filtered.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const cmd = filtered[index];
                if (cmd) run(cmd);
              }
            }}
          />
          <span style={{ paddingRight: 20 }}>
            <IconButton label="Close command palette" onClick={onClose}>
              <IconX size={18} />
            </IconButton>
          </span>
        </div>
        <div className="palette-list" ref={listRef} role="listbox" aria-label="Commands">
          {filtered.length === 0 ? <div className="palette-empty">No matching commands</div> : null}
          {filtered.map((c, i) => (
            <button
              key={c.id}
              role="option"
              aria-selected={i === index}
              className={"palette-item" + (i === index ? " palette-item-active" : "")}
              onMouseEnter={() => setIndex(i)}
              onClick={() => run(c)}
            >
              {c.icon}
              <span className="grow">{c.label}</span>
              {c.hint ? <span className="dim" style={{ fontSize: 12 }}>{c.hint}</span> : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= Toasts ================= */

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="toasts" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={"toast toast-" + t.tone}>
          <span className="toast-icon">
            {t.tone === "ok" ? (
              <IconCheckSquare size={16} strokeWidth={2.2} />
            ) : t.tone === "danger" ? (
              <IconX size={16} strokeWidth={2.2} />
            ) : t.tone === "warn" ? (
              <IconActivity size={16} strokeWidth={2.2} />
            ) : (
              <IconDatabase size={16} strokeWidth={2.2} />
            )}
          </span>
          <span className="grow">{t.message}</span>
          <button
            className="icon-btn"
            style={{ width: 32, height: 32 }}
            aria-label="Dismiss notification"
            onClick={() => dismissToast(t.id)}
          >
            <IconX size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ================= Shared page header ================= */

export function PageIntro({
  title,
  lede,
  actions,
}: {
  title: string;
  lede: string;
  actions?: ReactElement;
}) {
  return (
    <div className="flex items-center justify-between gap-16 wrap">
      <div className="grow" style={{ minWidth: 240 }}>
        <h2 style={{ fontSize: 22 }}>{title}</h2>
        <p className="card-sub" style={{ marginTop: 8 }}>
          {lede}
        </p>
      </div>
      {actions ? <div className="flex items-center gap-8 wrap">{actions}</div> : null}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "dim";
  return <Badge tone={tone as never}>{status.replace(/_/g, " ")}</Badge>;
}
