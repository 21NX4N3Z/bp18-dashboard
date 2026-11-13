import { useCallback, useEffect, useState } from "react";
import { CommandPalette, PAGE_META, Sidebar, Toasts, Topbar, type PageId } from "./components/shell";
import { OverviewPage } from "./pages/overview";
import { TasksPage } from "./pages/tasks";
import { BomPage } from "./pages/bom";
import { AnalyticsPage } from "./pages/analytics";
import { MembersPage } from "./pages/members";
import { FilesPage } from "./pages/files";
import { MilestonesPage } from "./pages/milestones";
import { SettingsPage } from "./pages/settings";
import { TvPage } from "./pages/tv";

function readHash(): PageId {
  const h = window.location.hash.replace(/^#\/?/, "") as PageId;
  return PAGE_META[h] ? h : "overview";
}

export function App() {
  const [page, setPage] = useState<PageId>(() => readHash());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tvOpen, setTvOpen] = useState(false);
  const [taskSignal, setTaskSignal] = useState(0);

  const navigate = useCallback((p: PageId) => {
    setPage(p);
    if (window.location.hash !== "#/" + p) window.location.hash = "#/" + p;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    function onHash() {
      const p = readHash();
      setPage((prev) => (prev === p ? prev : p));
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (mod && e.key.toLowerCase() === "t") {
        e.preventDefault();
        setTvOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setSidebarOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      <Sidebar
        page={page}
        onNavigate={navigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main">
        <Topbar
          page={page}
          onOpenPalette={() => setPaletteOpen(true)}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onOpenTv={() => setTvOpen(true)}
          onNavigate={(p) => {
            navigate(p);
            if (p === "tasks") setTaskSignal((n) => n + 1);
          }}
        />

        <main className="content" id="main-content">
          {page === "overview" ? <OverviewPage onNavigate={navigate} /> : null}
          {page === "tasks" ? <TasksPage openSignal={taskSignal} /> : null}
          {page === "bom" ? <BomPage /> : null}
          {page === "analytics" ? <AnalyticsPage /> : null}
          {page === "members" ? <MembersPage /> : null}
          {page === "files" ? <FilesPage /> : null}
          {page === "milestones" ? <MilestonesPage /> : null}
          {page === "settings" ? <SettingsPage /> : null}
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={navigate}
        onOpenTv={() => {
          setPaletteOpen(false);
          setTvOpen(true);
        }}
      />

      {tvOpen ? <TvPage onExit={() => setTvOpen(false)} /> : null}

      <Toasts />

      <span className="sr-only" aria-live="polite">
        {PAGE_META[page].title} view loaded
      </span>
    </div>
  );
}
