import { useStore } from "../lib/store";
import {
  activityItems,
  assigneeItems,
  computeKpis,
  criticalTasks,
  dueLoadItems,
  materialMixItems,
  recentActivity,
  statusItems,
  tagItems,
} from "../lib/derive";
import { daysUntil, fmtDate, fmtDateTime, fmtMoney, fmtNum, relTime, STATUS_TONE } from "../lib/format";
import { AreaChart, Columns, Donut, HBars, Legend, Sparkline } from "../components/charts";
import { Avatar, Badge, Card, CardHeader, EmptyState, Progress, Ring } from "../components/ui";
import {
  IconAlert,
  IconArrowDown,
  IconArrowUp,
  IconCalendar,
  IconCheckSquare,
  IconClock,
  IconGauge,
  IconLayers,
  IconScale,
  IconShield,
  IconTarget,
  IconUsers,
  IconZap,
} from "../components/icons";

export function OverviewPage({ onNavigate }: { onNavigate: (p: "tasks" | "bom" | "milestones" | "analytics" | "members") => void }) {
  const { state } = useStore();
  const k = computeKpis(state);
  const weightSeries = state.project.weightHistory.map((w) => ({
    label: new Date(w.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    value: w.weight,
  }));
  const crit = criticalTasks(state).slice(0, 6);
  const act = recentActivity(state, 9);
  const team = state.members.slice(0, 8);

  return (
    <>
      {/* Hero */}
      <Card className="hero">
        <div className="hero-left">
          <div className="hero-eyebrow">
            <span className="status-dot" aria-hidden="true" />
            {state.project.season} · BlackPearl FSAE · Frame &amp; Body
          </div>
          <h2 className="hero-title">
            {state.project.name} <span className="t-accent">/</span> SUBSTACK CONTROL
          </h2>
          <p className="hero-lede">
            Single source of truth for chassis, impact structures, body panels and the people building them.
            Every mutation is logged locally and persisted in this browser.
          </p>
          <div className="hero-facts">
            <HeroFact label="Competition" value={fmtDate(state.project.competitionDate)} />
            <HeroFact label="Days left" value={String(k.daysToComp)} tone="warn" />
            <HeroFact label="Team" value={String(state.members.length)} />
            <HeroFact label="Open tasks" value={String(k.openTasks)} tone={k.critOpen > 0 ? "danger" : "ok"} />
            <HeroFact label="Mass budget" value={k.actualTotal.toFixed(1) + " / " + k.budgetTotal.toFixed(1)} suffix="kg" />
          </div>
        </div>
        <div className="hero-right">
          <Ring value={k.progress} size={168} thickness={12} sub="TASKS DONE" label={k.progress + "%"} />
          <div className="hero-ring-legend">
            <span>
              <span className="legend-swatch" style={{ background: "var(--ok)" }} /> {k.doneTasks} done
            </span>
            <span>
              <span className="legend-swatch" style={{ background: "var(--warn)" }} /> {k.totalTasks - k.doneTasks} open
            </span>
          </div>
        </div>
      </Card>

      {/* KPI grid */}
      <div className="kpi-grid">
        <Kpi
          icon={<IconCheckSquare size={16} />}
          label="Task progress"
          value={k.progress + "%"}
          foot={
            <span className="flex items-center gap-8">
              <span className="kpi-trend-up">
                <IconArrowUp size={14} /> {k.doneTasks}
              </span>
              <span className="dim">{k.openTasks} open</span>
            </span>
          }
        />
        <Kpi
          icon={<IconAlert size={16} />}
          label="Critical open"
          value={String(k.critOpen)}
          tone={k.critOpen > 0 ? "danger" : "ok"}
          foot={<span className="dim">{k.overdue} overdue · {k.dueSoon} due this week</span>}
        />
        <Kpi
          icon={<IconScale size={16} />}
          label="Weight actual / target"
          value={state.project.currentWeight.toFixed(1)}
          suffix={"/ " + state.project.targetWeight + " kg"}
          tone={state.project.currentWeight > state.project.targetWeight ? "warn" : "ok"}
          foot={<Sparkline data={state.project.weightHistory.map((w) => w.weight)} tone="ok" />}
        />
        <Kpi
          icon={<IconLayers size={16} />}
          label="BOM cost"
          value={fmtNum(k.totalCost)}
          prefix="฿"
          foot={<span className="dim">{k.partCount} parts · ฿{fmtNum(Math.round(k.totalCost / Math.max(1, k.partCount)))} avg</span>}
        />
        <Kpi
          icon={<IconShield size={16} />}
          label="Milestones"
          value={k.milestoneDone + "/" + k.milestoneTotal}
          tone={k.delayed > 0 ? "warn" : "ok"}
          foot={<span className="dim">{k.delayed} delayed · {k.atRisk} at risk</span>}
        />
        <Kpi
          icon={<IconGauge size={16} />}
          label="Mfg complete"
          value={k.mfgDone + "/" + k.partCount}
          tone="accent"
          foot={
            <span className="dim">
              {k.mfgActive} in process · <span className="t-danger">{k.qcFail} QC fail</span>
            </span>
          }
        />
      </div>

      {/* Charts row */}
      <div className="split-main">
        <Card>
          <CardHeader
            title="Weight growth"
            subtitle="Measured assembly mass against competition target"
            icon={<IconScale size={18} />}
            actions={<Badge tone="ok">{state.project.currentWeight} kg</Badge>}
          />
          <AreaChart data={weightSeries} target={state.project.targetWeight} unit=" kg" height={260} />
          <div className="flex gap-16 wrap mt-16">
            {state.project.weightHistory.slice(-3).map((w) => (
              <div key={w.date} className="grow">
                <div className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>
                  {fmtDate(w.date)}
                </div>
                <div className="mono" style={{ fontSize: 16, color: "var(--text)" }}>
                  {w.weight} kg
                </div>
                <div className="dim" style={{ fontSize: 12 }}>{w.note}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Task status" subtitle="Live breakdown of the task board" icon={<IconCheckSquare size={18} />} />
          <div className="flex items-center gap-16 wrap">
            <Donut
              items={statusItems(state)}
              size={176}
              thickness={24}
              centerValue={String(k.totalTasks)}
              centerLabel="TASKS"
            />
            <div className="grow">
              <Legend
                items={statusItems(state).map((s) => ({ label: s.label, value: String(s.value), color: s.color }))}
              />
            </div>
          </div>
          <div className="mt-16">
            <HBars items={dueLoadItems(state).map((d) => ({ label: d.label, value: d.value }))} />
          </div>
        </Card>
      </div>

      {/* Weight budget + critical */}
      <div className="split-even">
        <Card>
          <CardHeader
            title="Subsystem weight budget"
            subtitle="Budget versus measured, kilograms"
            icon={<IconTarget size={18} />}
            actions={
              <Badge tone={k.weightDelta > 0 ? "danger" : "ok"}>
                {k.weightDelta > 0 ? "+" : ""}
                {k.weightDelta} kg
              </Badge>
            }
          />
          <HBars
            items={state.project.subsystemWeights.map((w) => ({
              label: w.subsystem,
              value: w.actual,
              max: w.budget,
              tone: w.actual > w.budget ? "danger" : w.actual > w.budget * 0.9 ? "warn" : "ok",
            }))}
            unit=" kg"
          />
          <div className="flex gap-16 wrap mt-16">
            <span className="dim" style={{ fontSize: 12 }}>Budget {k.budgetTotal} kg</span>
            <span className="dim" style={{ fontSize: 12 }}>Actual {k.actualTotal.toFixed(1)} kg</span>
            <span className="dim" style={{ fontSize: 12 }}>
              Utilisation {Math.round((k.actualTotal / k.budgetTotal) * 100)}%
            </span>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Critical attention"
            subtitle="Critical priority or past due"
            icon={<IconAlert size={18} />}
            actions={
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("tasks")}>
                All tasks
              </button>
            }
          />
          {crit.length === 0 ? (
            <EmptyState title="Nothing critical" hint="No critical tasks and nothing past due." />
          ) : (
            <div className="feed">
              {crit.map((t) => {
                const d = daysUntil(t.due);
                const member = state.members.find((m) => m.id === t.assigneeId);
                return (
                  <div className="feed-item" key={t.id}>
                    <div className="feed-rail">
                      <span
                        className={
                          "feed-dot " + (d < 0 ? "feed-dot-danger" : t.priority === "critical" ? "feed-dot-warn" : "feed-dot-info")
                        }
                      />
                    </div>
                    <div className="feed-body">
                      <div className="feed-msg">
                        <span className="table-strong">{t.title}</span>
                        {d < 0 ? (
                          <Badge tone="danger">OVERDUE {Math.abs(d)}d</Badge>
                        ) : (
                          <Badge tone={STATUS_TONE[t.priority] as never}>{t.priority.toUpperCase()}</Badge>
                        )}
                      </div>
                      <div className="feed-meta">
                        <span>{member ? member.name : "Unassigned"}</span>
                        <span>{fmtDate(t.due)}</span>
                        <span>{t.status.replace("-", " ").toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Milestones strip */}
      <Card>
        <CardHeader
          title="Season timeline"
          subtitle="Kickoff to endurance — live status"
          icon={<IconCalendar size={18} />}
          actions={
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("milestones")}>
              Full timeline
            </button>
          }
        />
        <div className="strip">
          {state.milestones.map((m, i) => {
            const tone = m.status === "completed" ? "ok" : m.status === "delayed" ? "danger" : m.status === "at-risk" ? "warn" : "dim";
            return (
              <div className="strip-item" key={m.id}>
                <div className="strip-rail">
                  <span className={"timeline-dot timeline-dot-" + tone} />
                  {i < state.milestones.length - 1 ? <span className="strip-line" /> : null}
                </div>
                <div className="strip-body">
                  <div className="strip-title">{m.name}</div>
                  <div className="strip-meta mono">{fmtDate(m.dueDate)}</div>
                </div>
                <Badge tone={tone as never}>{m.status.replace("-", " ").toUpperCase()}</Badge>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Activity + team */}
      <div className="split-main">
        <Card>
          <CardHeader
            title="Activity"
            subtitle="Every mutation, newest first"
            icon={<IconZap size={18} />}
            actions={<Badge tone="dim">{state.activity.length} EVENTS</Badge>}
          />
          <div className="feed">
            {act.map((a) => {
              const actor = state.members.find((m) => m.id === a.actorId);
              const tone =
                a.type === "error" ? "danger" : a.type === "approve" || a.type === "upload" ? "ok" : a.type === "reminder" || a.type === "bom" ? "warn" : "info";
              return (
                <div className="feed-item" key={a.id}>
                  <div className="feed-rail">
                    <span className={"feed-dot feed-dot-" + tone} />
                  </div>
                  <div className="feed-body">
                    <div className="feed-msg">{a.message}</div>
                    <div className="feed-meta">
                      <span>{actor ? actor.name : "System"}</span>
                      <span title={fmtDateTime(a.timestamp)}>{relTime(a.timestamp)}</span>
                      <span className="dim">{a.type.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Team load"
            subtitle="Open tasks per member"
            icon={<IconUsers size={18} />}
            actions={
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("members")}>
                Roster
              </button>
            }
          />
          <div className="flex flex-wrap gap-8 wrap mb-16">
            {team.map((m) => (
              <span key={m.id} className="flex items-center gap-8">
                <Avatar name={m.name} size={28} />
                <span className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>{m.name}</span>
              </span>
            ))}
          </div>
          <HBars items={assigneeItems(state).slice(0, 7)} />
          <div className="mt-16">
            <div className="dim" style={{ fontSize: 12, marginBottom: 8 }}>
              Tag load
            </div>
            <Columns items={tagItems(state).slice(0, 6)} height={180} />
          </div>
        </Card>
      </div>

      {/* Material mix */}
      <div className="split-even">
        <Card>
          <CardHeader title="Material mix" subtitle="Share of assembly mass" icon={<IconLayers size={18} />} />
          <div className="flex items-center gap-16 wrap">
            <Donut items={materialMixItems(state)} size={168} thickness={24} centerValue={k.totalWeight.toFixed(1)} centerLabel="KG" />
            <div className="grow">
              <Legend
                items={materialMixItems(state).map((m) => ({
                  label: m.label,
                  value: m.value + " kg",
                  color: m.color,
                }))}
              />
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Activity mix" subtitle="Events by type in the local log" icon={<IconClock size={18} />} />
          <HBars items={activityItems(state)} />
        </Card>
      </div>

      <style>{`
        .hero { display: flex; gap: 24px; align-items: center; justify-content: space-between; flex-wrap: wrap; background: var(--surface); }
        .hero-left { flex: 1 1 420px; min-width: 0; }
        .hero-eyebrow { display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-3); }
        .hero-title { font-size: 44px; font-weight: 700; letter-spacing: 0.04em; margin: 8px 0 0; }
        .hero-lede { margin-top: 16px; color: var(--text-2); font-size: 16px; max-width: 640px; }
        .hero-facts { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 24px; }
        .hero-fact { padding: 8px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface-2); min-width: 120px; }
        .hero-fact-label { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-3); }
        .hero-fact-value { font-family: var(--font-mono); font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; margin-top: 4px; }
        .hero-right { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .hero-ring-legend { display: flex; gap: 16px; font-size: 13px; color: var(--text-2); }
        .hero-ring-legend > span { display: inline-flex; align-items: center; gap: 8px; }
        .strip { display: flex; gap: 0; overflow-x: auto; padding-bottom: 8px; }
        .strip-item { flex: 1 0 176px; min-width: 176px; padding-right: 16px; display: flex; flex-direction: column; gap: 8px; }
        .strip-rail { display: flex; flex-direction: column; align-items: center; height: 24px; }
        .strip-line { width: 2px; flex: 1; background: var(--border); }
        .strip-body { min-width: 0; }
        .strip-title { font-family: var(--font-display); font-size: 18px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text); line-height: 1.1; }
        .strip-meta { font-size: 12px; color: var(--text-3); }
        @media (max-width: 640px) { .hero-title { font-size: 32px; } }
      `}</style>
    </>
  );
}

function HeroFact({ label, value, suffix, tone }: { label: string; value: string; suffix?: string; tone?: "ok" | "warn" | "danger" }) {
  return (
    <div className="hero-fact">
      <div className="hero-fact-label">{label}</div>
      <div
        className="hero-fact-value"
        style={tone ? { color: "var(--" + tone + ")" } : undefined}
      >
        {value}
        {suffix ? <span style={{ fontSize: 12, color: "var(--text-3)" }}> {suffix}</span> : null}
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  suffix,
  prefix,
  foot,
  tone = "accent",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  prefix?: string;
  foot?: React.ReactNode;
  tone?: "accent" | "ok" | "warn" | "danger";
}) {
  return (
    <Card className="kpi">
      <div className="kpi-label">
        <span style={{ color: "var(--text-3)" }}>{icon}</span>
        {label}
      </div>
      <div className="kpi-value" style={{ color: tone === "accent" ? "var(--text)" : "var(--" + tone + ")" }}>
        {prefix ? <span className="kpi-unit">{prefix}</span> : null}
        {value}
        {suffix ? <span className="kpi-unit">{suffix}</span> : null}
      </div>
      {foot ? <div className="kpi-foot">{foot}</div> : null}
    </Card>
  );
}
