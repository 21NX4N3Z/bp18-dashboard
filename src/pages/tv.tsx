import { useEffect, useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { computeKpis, criticalTasks, recentActivity, statusItems, dueLoadItems } from "../lib/derive";
import { daysUntil, fmtDate, relTime, STATUS_TONE } from "../lib/format";
import { AreaChart, Columns, Donut, Legend } from "../components/charts";
import { Avatar, Badge, Button, Progress } from "../components/ui";
import { IconAlert, IconCalendar, IconCheckSquare, IconScale, IconX, IconZap } from "../components/icons";

export function TvPage({ onExit }: { onExit: () => void }) {
  const { state } = useStore();
  const k = computeKpis(state);
  const crit = useMemo(() => criticalTasks(state).slice(0, 5), [state]);
  const act = useMemo(() => recentActivity(state, 6), [state]);
  const status = statusItems(state);
  const due = dueLoadItems(state);
  const weightSeries = state.project.weightHistory.map((w) => ({
    label: new Date(w.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    value: w.weight,
  }));
  const [focus, setFocus] = useState(0);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const t = window.setInterval(() => setClock(new Date()), 1000);
    const r = window.setInterval(() => setFocus((f) => (f + 1) % 6), 10000);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onExit();
      if (e.key === "ArrowRight") setFocus((f) => (f + 1) % 6);
      if (e.key === "ArrowLeft") setFocus((f) => (f + 5) % 6);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearInterval(t);
      window.clearInterval(r);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onExit]);

  return (
    <div className="tv" role="dialog" aria-modal="true" aria-label="TV mode — workshop display">
      <div className="tv-head">
        <div>
          <div className="tv-title">
            BP18 <span className="t-accent">/</span> F&amp;B CONTROL
          </div>
          <div className="mono" style={{ fontSize: 14, color: "var(--text-3)", letterSpacing: "0.16em", marginTop: 8 }}>
            {state.project.season} · {state.project.name} · FRAME &amp; BODY
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="tv-clock mono">{clock.toLocaleTimeString("en-GB")}</div>
          <div className="mono" style={{ fontSize: 14, color: "var(--text-3)", letterSpacing: "0.16em" }}>
            {k.seasonOver ? "SEASON COMPLETED" : `T-MINUS ${k.daysToComp} DAYS`}
          </div>
        </div>
      </div>

      <div className="tv-grid">
        <TvCard title="Task progress" focus={focus === 0}>
          <div className="flex items-center gap-16">
            <div>
              <div className="tv-kpi">{k.progress}%</div>
              <div className="mono" style={{ fontSize: 16, color: "var(--text-3)", marginTop: 8 }}>
                {k.doneTasks} / {k.totalTasks} CLOSED
              </div>
            </div>
            <div className="grow">
              <Progress value={k.progress} tone="ok" height={24} />
              <div className="mono" style={{ fontSize: 16, marginTop: 16, color: "var(--warn)" }}>
                {k.critOpen} CRITICAL OPEN · {k.overdue} OVERDUE
              </div>
            </div>
          </div>
        </TvCard>

        <TvCard title="Weight growth" focus={focus === 1}>
          <AreaChart data={weightSeries} target={state.project.targetWeight} unit=" kg" height={220} labelEvery={2} />
          <div className="mono" style={{ fontSize: 18, marginTop: 8 }}>
            {state.project.currentWeight} <span className="tv-kpi-unit">kg actual</span> / {state.project.targetWeight}{" "}
            <span className="tv-kpi-unit">kg target</span>
          </div>
        </TvCard>

        <TvCard title="Task status" focus={focus === 2}>
          <div className="flex items-center gap-16">
            <Donut items={status} size={160} thickness={26} centerValue={String(k.totalTasks)} centerLabel="TASKS" />
            <div className="grow">
              <Legend items={status.map((s) => ({ label: s.label, value: String(s.value), color: s.color }))} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <Columns items={due} height={110} />
          </div>
        </TvCard>

        <TvCard title="Critical attention" focus={focus === 3}>
          <div className="tv-list">
            {crit.length === 0 ? (
              <div className="mono" style={{ fontSize: 18, color: "var(--ok)" }}>
                NO CRITICAL WORK
              </div>
            ) : (
              crit.map((t) => {
                const member = state.members.find((m) => m.id === t.assigneeId);
                const d = daysUntil(t.due);
                return (
                  <div className="tv-list-item" key={t.id}>
                    <span className="flex items-center gap-8" style={{ minWidth: 0 }}>
                      <IconAlert size={18} style={{ color: d < 0 ? "var(--danger)" : "var(--warn)", flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                    </span>
                    <span className="mono" style={{ fontSize: 16, color: "var(--text-3)", flexShrink: 0 }}>
                      {member?.name ?? "—"} · {d < 0 ? Math.abs(d) + "d OVER" : d + "d"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </TvCard>

        <TvCard title="Season timeline" focus={focus === 4}>
          <div className="tv-list">
            {state.milestones.slice(0, 6).map((m) => {
              const tone = m.status === "completed" ? "ok" : m.status === "delayed" ? "danger" : m.status === "at-risk" ? "warn" : "dim";
              return (
                <div className="tv-list-item" key={m.id}>
                  <span className="flex items-center gap-8" style={{ minWidth: 0 }}>
                    <IconCalendar size={18} style={{ color: "var(--" + tone + ")", flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                  </span>
                  <Badge tone={tone as never}>{m.status.replace("-", " ").toUpperCase()}</Badge>
                </div>
              );
            })}
          </div>
        </TvCard>

        <TvCard title="Activity" focus={focus === 5}>
          <div className="tv-list">
            {act.map((a) => {
              const actor = state.members.find((m) => m.id === a.actorId);
              const tone =
                a.type === "error" ? "danger" : a.type === "approve" || a.type === "upload" ? "ok" : a.type === "reminder" || a.type === "bom" ? "warn" : "info";
              return (
                <div className="tv-list-item" key={a.id}>
                  <span className="flex items-center gap-8" style={{ minWidth: 0 }}>
                    <IconZap size={18} style={{ color: "var(--" + tone + ")", flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 18 }}>
                      {a.message}
                    </span>
                  </span>
                  <span className="mono" style={{ fontSize: 16, color: "var(--text-3)", flexShrink: 0 }}>
                    {relTime(a.timestamp).toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </TvCard>
      </div>

      <div className="flex items-center justify-between">
        <div className="mono" style={{ fontSize: 14, color: "var(--text-3)", letterSpacing: "0.14em" }}>
          WEIGHT {state.project.currentWeight} kg · COST ฿{k.totalCost.toLocaleString("en-US")} · MFG {k.mfgDone}/{k.partCount}
        </div>
        <div className="mono" style={{ fontSize: 14, color: "var(--text-3)", letterSpacing: "0.14em" }}>
          ESC TO EXIT · ARROW KEYS TO ROTATE
        </div>
      </div>

      <Button variant="ghost" className="tv-exit" onClick={onExit}>
        <IconX size={18} /> Exit
      </Button>
    </div>
  );
}

function TvCard({ title, focus, children }: { title: string; focus: boolean; children: React.ReactNode }) {
  return (
    <div
      className="tv-card"
      style={{
        borderColor: focus ? "var(--accent)" : "var(--border)",
        boxShadow: focus ? "var(--shadow)" : "none",
      }}
    >
      <h2>{title}</h2>
      <div className="grow" style={{ minHeight: 0, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}
