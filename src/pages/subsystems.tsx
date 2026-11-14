import { useMemo } from "react";
import { useStore } from "../lib/store";
import type { Member, Task } from "../lib/types";
import { Avatar, Badge, Card, CardHeader, EmptyState, Progress } from "../components/ui";
import { IconAlert, IconCheckSquare, IconGauge, IconUsers } from "../components/icons";
import { Reveal } from "../components/anim";

/**
 * Team-wide view: the programme is split by subsystem, not by a single
 * department. Every group sees its own load, its own critical items and its
 * own completion, so the dashboard answers "how is MY group doing?" as well as
 * "how is the car doing?".
 */

const ORDER = ["Chassis", "Suspension", "Powertrain", "High Voltage", "Low Voltage", "Systems", "General"];

type Row = {
  subsystem: string;
  members: Member[];
  tasks: Task[];
  open: number;
  done: number;
  crit: number;
  overdue: number;
  pct: number;
};

function buildRows(members: Member[], tasks: Task[]): Row[] {
  const map = new Map<string, Row>();
  const ensure = (name: string): Row => {
    let r = map.get(name);
    if (!r) {
      r = { subsystem: name, members: [], tasks: [], open: 0, done: 0, crit: 0, overdue: 0, pct: 0 };
      map.set(name, r);
    }
    return r;
  };
  for (const m of members) ensure(m.subsystem || "General").members.push(m);
  const now = Date.now();
  for (const t of tasks) {
    const owner = members.find((m) => m.id === t.assigneeId);
    const r = ensure(owner?.subsystem || "General");
    r.tasks.push(t);
    if (t.status === "done") r.done += 1;
    else {
      r.open += 1;
      if (t.priority === "critical") r.crit += 1;
      if (new Date(t.due).getTime() < now) r.overdue += 1;
    }
  }
  const rows = [...map.values()];
  for (const r of rows) r.pct = r.tasks.length ? Math.round((r.done / r.tasks.length) * 100) : 0;
  rows.sort((a, b) => {
    const ia = ORDER.indexOf(a.subsystem);
    const ib = ORDER.indexOf(b.subsystem);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  return rows;
}

export function SubsystemsPage({ onNavigate }: { onNavigate: (p: "tasks" | "members" | "analytics") => void }) {
  const { state } = useStore();
  const rows = useMemo(() => buildRows(state.members, state.tasks), [state.members, state.tasks]);

  const totals = useMemo(() => {
    const all = rows.reduce(
      (acc, r) => ({
        members: acc.members + r.members.length,
        tasks: acc.tasks + r.tasks.length,
        open: acc.open + r.open,
        crit: acc.crit + r.crit,
      }),
      { members: 0, tasks: 0, open: 0, crit: 0 }
    );
    return { ...all, pct: all.tasks ? Math.round(((all.tasks - all.open) / all.tasks) * 100) : 0 };
  }, [rows]);

  return (
    <>
      <div className="flex items-center justify-between gap-16 wrap">
        <div className="grow" style={{ minWidth: 240 }}>
          <h2 style={{ fontSize: 22 }}>Subsystems</h2>
          <p className="card-sub" style={{ marginTop: 8 }}>
            The whole programme, grouped the way the team actually works — {rows.length} groups, {totals.members}{" "}
            people, {totals.tasks} tracked tasks.
          </p>
        </div>
        <div className="flex items-center gap-8 wrap">
          <Badge tone="dim">
            <IconUsers size={12} /> {totals.members} PEOPLE
          </Badge>
          <Badge tone={totals.crit > 0 ? "danger" : "ok"}>
            <IconAlert size={12} /> {totals.crit} CRITICAL
          </Badge>
          <Badge tone="info">
            <IconGauge size={12} /> {totals.pct}% COMPLETE
          </Badge>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No subsystems yet" hint="Add members and assign them a subsystem to populate this view." />
      ) : (
        <div className="subsys-grid">
          {rows.map((r, i) => (
            <Reveal key={r.subsystem} delay={i * 60}>
              <Card className="subsys-card">
                <CardHeader
                  title={r.subsystem}
                  subtitle={
                    r.members.length +
                    " member" +
                    (r.members.length === 1 ? "" : "s") +
                    " · " +
                    r.tasks.length +
                    " tasks"
                  }
                  icon={<IconUsers size={18} />}
                  actions={
                    <Badge tone={r.crit > 0 ? "danger" : r.pct === 100 ? "ok" : "dim"}>
                      {r.crit > 0 ? r.crit + " CRIT" : r.pct + "%"}
                    </Badge>
                  }
                />

                <div className="subsys-stats">
                  <div>
                    <div className="mono subsys-num">{r.open}</div>
                    <div className="subsys-label">open</div>
                  </div>
                  <div>
                    <div className="mono subsys-num">{r.done}</div>
                    <div className="subsys-label">done</div>
                  </div>
                  <div>
                    <div className="mono subsys-num" style={{ color: r.overdue > 0 ? "var(--danger)" : undefined }}>
                      {r.overdue}
                    </div>
                    <div className="subsys-label">overdue</div>
                  </div>
                </div>

                <Progress
                  value={r.pct}
                  tone={r.crit > 0 ? "danger" : r.pct >= 70 ? "ok" : "accent"}
                  height={6}
                />

                <div className="subsys-tags">
                  {topTags(r.tasks).map((t) => (
                    <span key={t} className="badge badge-dim">
                      {t}
                    </span>
                  ))}
                </div>

                {r.members.length > 0 ? (
                  <div className="flex flex-wrap gap-8 wrap">
                    {r.members.slice(0, 8).map((m) => (
                      <span key={m.id} className="flex items-center gap-8" title={m.position}>
                        <Avatar name={m.name} size={24} />
                        <span className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>
                          {m.name}
                        </span>
                      </span>
                    ))}
                    {r.members.length > 8 ? (
                      <span className="dim" style={{ fontSize: 12 }}>
                        +{r.members.length - 8} more
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex gap-8 mt-16">
                  <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("tasks")}>
                    <IconCheckSquare size={14} /> Tasks
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("members")}>
                    <IconUsers size={14} /> Roster
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("analytics")}>
                    <IconGauge size={14} /> Analytics
                  </button>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}

function topTags(tasks: Task[]): string[] {
  const counts = new Map<string, number>();
  for (const t of tasks) for (const tag of t.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([t]) => t);
}
