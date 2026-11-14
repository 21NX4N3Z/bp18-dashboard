import { useEffect, useMemo, useState } from "react";
import { useStore } from "../lib/store";
import type { Milestone, MilestoneStatus } from "../lib/types";
import { computeKpis } from "../lib/derive";
import { daysUntil, fmtDate, STATUS_LABEL, STATUS_TONE } from "../lib/format";
import { Badge, Button, Card, CardHeader, EmptyState, Field, IconButton, Input, Modal, Progress, Select } from "../components/ui";
import { IconCalendar, IconCheckCircle, IconEdit, IconPlus, IconTrash } from "../components/icons";

const STATUS_ORDER: MilestoneStatus[] = ["completed", "pending", "at-risk", "delayed"];

const TONE: Record<MilestoneStatus, "ok" | "dim" | "warn" | "danger"> = {
  completed: "ok",
  pending: "dim",
  "at-risk": "warn",
  delayed: "danger",
};

export function MilestonesPage() {
  const { state, deleteMilestone } = useStore();
  const [filter, setFilter] = useState<"all" | MilestoneStatus>("all");
  const [editing, setEditing] = useState<Milestone | "new" | null>(null);
  const [deleting, setDeleting] = useState<Milestone | null>(null);

  const k = computeKpis(state);

  const rows = useMemo(() => {
    const list = state.milestones.filter((m) => filter === "all" || m.status === filter);
    return [...list].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [state.milestones, filter]);

  const counts = useMemo(() => {
    const m = new Map<MilestoneStatus, number>();
    for (const s of STATUS_ORDER) m.set(s, 0);
    for (const x of state.milestones) m.set(x.status, (m.get(x.status) ?? 0) + 1);
    return m;
  }, [state.milestones]);

  return (
    <>
      <div className="kpi-grid">
        <Card className="kpi">
          <div className="kpi-label">Milestones</div>
          <div className="kpi-value">{k.milestoneDone}/{k.milestoneTotal}</div>
          <div className="kpi-foot">
            <Progress value={k.milestoneTotal ? (k.milestoneDone / k.milestoneTotal) * 100 : 0} tone="ok" height={8} />
          </div>
        </Card>
        <Card className="kpi">
          <div className="kpi-label">Next milestone</div>
          <div className="kpi-value" style={{ fontSize: 24, lineHeight: 1.2 }}>
            {nextMilestone(state.milestones)?.name ?? "—"}
          </div>
          <div className="kpi-foot">
            <span className="dim">{nextMilestone(state.milestones) ? fmtDate(nextMilestone(state.milestones)!.dueDate) : "all complete"}</span>
          </div>
        </Card>
        <Card className="kpi">
          <div className="kpi-label">Delayed</div>
          <div className="kpi-value t-danger">{k.delayed}</div>
          <div className="kpi-foot"><span className="dim">{k.atRisk} at risk</span></div>
        </Card>
        <Card className="kpi">
          <div className="kpi-label">Competition</div>
          <div className="kpi-value">{fmtDate(state.project.competitionDate)}</div>
          <div className="kpi-foot"><span className="dim">{k.seasonOver ? "season completed" : k.daysToComp + " days remaining"}</span></div>
        </Card>
      </div>

      <Card className="card-flush">
        <div style={{ padding: 20 }}>
          <CardHeader
            title="Season timeline"
            subtitle="Kickoff through endurance — status is live from the shared database"
            icon={<IconCalendar size={18} />}
            actions={
              <Button variant="primary" onClick={() => setEditing("new")}>
                <IconPlus size={16} />
                Add milestone
              </Button>
            }
          />
          <div className="filter-bar">
            <button className={"filter-chip" + (filter === "all" ? " filter-chip-active" : "")} onClick={() => setFilter("all")} aria-pressed={filter === "all"}>
              ALL {state.milestones.length}
            </button>
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                className={"filter-chip" + (filter === s ? " filter-chip-active" : "")}
                onClick={() => setFilter(filter === s ? "all" : s)}
                aria-pressed={filter === s}
                style={filter !== s ? { color: "var(--" + TONE[s] + ")" } : undefined}
              >
                {STATUS_LABEL[s]} {counts.get(s) ?? 0}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "0 20px 20px" }}>
          {rows.length === 0 ? (
            <EmptyState title="No milestones" hint="Add the first milestone to start the season timeline." />
          ) : (
            <div className="timeline">
              {rows.map((m) => {
                const tone = TONE[m.status];
                const d = daysUntil(m.dueDate);
                return (
                  <div className="timeline-item" key={m.id}>
                    <div className="timeline-rail">
                      <span className={"timeline-dot timeline-dot-" + tone} />
                      <span className="timeline-line" />
                    </div>
                    <div className="timeline-body">
                      <div className="timeline-title">
                        {m.name}
                        {m.status !== "completed" && d < 0 ? <Badge tone="danger">OVERDUE {Math.abs(d)}d</Badge> : null}
                        {m.status === "completed" ? (
                          <Badge tone="ok">
                            <IconCheckCircle size={12} strokeWidth={2.2} /> CLOSED
                          </Badge>
                        ) : null}
                      </div>
                      <div className="timeline-meta">
                        <span>{fmtDate(m.dueDate)}</span>
                        <span>{m.status === "completed" ? "completed" : d < 0 ? Math.abs(d) + " days overdue" : d + " days remaining"}</span>
                        <span>STATUS {STATUS_LABEL[m.status]}</span>
                      </div>
                    </div>
                    <div className="row-actions">
                      <IconButton label={"Edit " + m.name} onClick={() => setEditing(m)}>
                        <IconEdit size={16} />
                      </IconButton>
                      <IconButton label={"Delete " + m.name} onClick={() => setDeleting(m)}>
                        <IconTrash size={16} />
                      </IconButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <MilestoneModal milestone={editing} onClose={() => setEditing(null)} />
      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete milestone"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleting) deleteMilestone(deleting.id);
                setDeleting(null);
              }}
            >
              <IconTrash size={16} /> Delete
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 16 }}>
          Delete <strong>{deleting?.name}</strong> from the timeline?
        </p>
      </Modal>
    </>
  );
}

function nextMilestone(milestones: Milestone[]): Milestone | null {
  const open = milestones
    .filter((m) => m.status !== "completed")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  return open[0] ?? null;
}

function MilestoneModal({ milestone, onClose }: { milestone: Milestone | "new" | null; onClose: () => void }) {
  const { addMilestone, updateMilestone } = useStore();
  const isNew = milestone === "new";
  const current = isNew || milestone === null ? null : milestone;

  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<MilestoneStatus>("pending");

  useEffect(() => {
    if (!milestone) return;
    setName(current?.name ?? "");
    setDueDate(current ? current.dueDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setStatus(current?.status ?? "pending");
  }, [milestone, current]);

  if (!milestone) return null;

  function save() {
    if (!name.trim()) return;
    const payload = { name: name.trim(), dueDate: new Date(dueDate + "T09:00:00").toISOString(), status };
    if (isNew) addMilestone(payload);
    else if (current) updateMilestone(current.id, payload);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Add milestone" : "Edit milestone"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!name.trim() || !dueDate}>
            <IconPlus size={16} />
            {isNew ? "Add milestone" : "Save changes"}
          </Button>
        </>
      }
    >
      <Field label="Milestone name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Frame Welding Complete" autoFocus />
      </Field>
      <div className="form-grid">
        <Field label="Due date">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as MilestoneStatus)}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Input type="hidden" aria-hidden="true" tabIndex={-1} />
    </Modal>
  );
}
