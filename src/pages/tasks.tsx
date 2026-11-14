import { useEffect, useMemo, useState } from "react";
import { useStore } from "../lib/store";
import type { Task, TaskPriority, TaskStatus } from "../lib/types";
import { daysUntil, fmtDate, STATUS_LABEL, STATUS_TONE, titleCase } from "../lib/format";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, IconButton, Input, Modal, Segmented, Select, Textarea } from "../components/ui";
import {
  IconCheckSquare,
  IconChevronRight,
  IconEdit,
  IconFilter,
  IconPlus,
  IconSearch,
  IconTrash,
} from "../components/icons";

type View = "table" | "kanban";

const STATUS_ORDER: TaskStatus[] = ["todo", "in-progress", "review", "done"];
const PRIORITY_ORDER: TaskPriority[] = ["critical", "high", "medium", "low"];

export function TasksPage({ openSignal = 0 }: { openSignal?: number }) {
  const { state, deleteTask, updateTask } = useStore();
  const [view, setView] = useState<View>("table");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | TaskStatus>("all");
  const [priority, setPriority] = useState<"all" | TaskPriority>("all");
  const [assignee, setAssignee] = useState<"all" | string>("all");
  const [subsystem, setSubsystem] = useState<"all" | string>("all");
  const [sort, setSort] = useState<"due" | "priority" | "title">("due");
  const [editing, setEditing] = useState<Task | "new" | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);

  useEffect(() => {
    if (openSignal > 0) setEditing("new");
  }, [openSignal]);

  const subsystems = useMemo(() => {
    const present = new Set(state.members.map((m) => m.subsystem || "General"));
    return ["Chassis", "Suspension", "Powertrain", "High Voltage", "Low Voltage", "Systems", "General"].filter((s) =>
      present.has(s)
    );
  }, [state.members]);

  const tasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = state.tasks.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (assignee !== "all" && t.assigneeId !== assignee) return false;
      if (subsystem !== "all") {
        const owner = state.members.find((m) => m.id === t.assigneeId);
        if ((owner?.subsystem || "General") !== subsystem) return false;
      }
      if (q && !t.title.toLowerCase().includes(q) && !t.tags.some((x) => x.toLowerCase().includes(q))) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "due") return daysUntil(a.due) - daysUntil(b.due);
      if (sort === "title") return a.title.localeCompare(b.title);
      return PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
    });
    return list;
  }, [state.tasks, state.members, query, status, priority, assignee, subsystem, sort]);

  const counts = useMemo(() => {
    const m = new Map<TaskStatus, number>();
    for (const s of STATUS_ORDER) m.set(s, 0);
    for (const t of state.tasks) m.set(t.status, (m.get(t.status) ?? 0) + 1);
    return m;
  }, [state.tasks]);

  return (
    <>
      <Card className="card-flush">
        <div style={{ padding: 20 }}>
          <CardHeader
            title="Task board"
            subtitle={state.tasks.length + " tasks · " + (counts.get("done") ?? 0) + " done · " + (state.tasks.length - (counts.get("done") ?? 0)) + " open"}
            icon={<IconCheckSquare size={18} />}
            actions={
              <>
                <Segmented
                  label="Task view"
                  value={view}
                  onChange={setView}
                  options={[
                    { value: "table", label: "Table" },
                    { value: "kanban", label: "Kanban" },
                  ]}
                />
                <Button variant="primary" onClick={() => setEditing("new")}>
                  <IconPlus size={16} />
                  New task
                </Button>
              </>
            }
          />

          <div className="filter-bar">
            <div className="search-box">
              <IconSearch size={16} />
              <input
                placeholder="Search title or tag..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search tasks"
              />
            </div>
            <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Filter by assignee" style={{ width: 180, minHeight: 40 }}>
              <option value="all">All members</option>
              {state.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
            <Select value={subsystem} onChange={(e) => setSubsystem(e.target.value)} aria-label="Filter by subsystem" style={{ width: 180, minHeight: 40 }}>
              <option value="all">All subsystems</option>
              {subsystems.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select value={sort} onChange={(e) => setSort(e.target.value as never)} aria-label="Sort tasks" style={{ width: 160, minHeight: 40 }}>
              <option value="due">Sort: due date</option>
              <option value="priority">Sort: priority</option>
              <option value="title">Sort: title</option>
            </Select>
            <div className="grow" />
            <IconFilter size={16} className="dim" />
            <FilterChip active={status === "all"} onClick={() => setStatus("all")} label={"ALL " + state.tasks.length} />
            {STATUS_ORDER.map((s) => (
              <FilterChip
                key={s}
                active={status === s}
                onClick={() => setStatus(status === s ? "all" : s)}
                label={STATUS_LABEL[s] + " " + (counts.get(s) ?? 0)}
                tone={STATUS_TONE[s]}
              />
            ))}
            <span style={{ width: 1, height: 24, background: "var(--border)" }} aria-hidden="true" />
            <FilterChip active={priority === "all"} onClick={() => setPriority("all")} label="ANY PRI" />
            {PRIORITY_ORDER.map((p) => (
              <FilterChip
                key={p}
                active={priority === p}
                onClick={() => setPriority(priority === p ? "all" : p)}
                label={STATUS_LABEL[p]}
                tone={STATUS_TONE[p]}
              />
            ))}
          </div>
        </div>

        {view === "table" ? (
          <div className="table-wrap" style={{ padding: "0 20px 20px", margin: 0 }}>
            {tasks.length === 0 ? (
              <EmptyState
                title="No tasks match"
                hint="Adjust the filters or create a new task."
                action={
                  <Button variant="primary" onClick={() => setEditing("new")}>
                    <IconPlus size={16} /> New task
                  </Button>
                }
              />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "38%" }}>Task</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assignee</th>
                    <th>Tags</th>
                    <th style={{ textAlign: "right" }}>Due</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => {
                    const member = state.members.find((m) => m.id === t.assigneeId);
                    const d = daysUntil(t.due);
                    const overdue = t.status !== "done" && d < 0;
                    return (
                      <tr key={t.id}>
                        <td>
                          <div className="table-strong">{t.title}</div>
                          <div className="table-muted">added {fmtDate(t.createdAt)}</div>
                        </td>
                        <td>
                          <Select
                            value={t.status}
                            onChange={(e) => updateTask(t.id, { status: e.target.value as TaskStatus })}
                            aria-label={"Status for " + t.title}
                            style={{ minHeight: 32, padding: "4px 8px", fontSize: 13, width: 140 }}
                          >
                            {STATUS_ORDER.map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABEL[s]}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td>
                          <Badge tone={STATUS_TONE[t.priority] as never}>{STATUS_LABEL[t.priority]}</Badge>
                        </td>
                        <td>
                          <div className="flex items-center gap-8">
                            <Avatar name={member?.name ?? "?"} size={28} />
                            <span style={{ fontSize: 14 }}>{member?.name ?? "Unassigned"}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-8 wrap">
                            {t.tags.map((tag) => (
                              <span key={tag} className="badge badge-dim">
                                {tag.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="table-num" style={overdue ? { color: "var(--danger)" } : undefined}>
                          {fmtDate(t.due)}
                          <div className="table-muted" style={overdue ? { color: "var(--danger)" } : undefined}>
                            {t.status === "done" ? "closed" : d < 0 ? Math.abs(d) + "d over" : d === 0 ? "today" : d + "d"}
                          </div>
                        </td>
                        <td>
                          <div className="row-actions">
                            {t.status !== "done" ? (
                              <IconButton label={"Mark " + t.title + " done"} onClick={() => updateTask(t.id, { status: "done" })}>
                                <IconCheckSquare size={16} />
                              </IconButton>
                            ) : null}
                            <IconButton label={"Edit " + t.title} onClick={() => setEditing(t)}>
                              <IconEdit size={16} />
                            </IconButton>
                            <IconButton label={"Delete " + t.title} onClick={() => setDeleting(t)}>
                              <IconTrash size={16} />
                            </IconButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div style={{ padding: "0 20px 20px" }}>
            <div className="kanban">
              {STATUS_ORDER.map((s) => {
                const col = tasks.filter((t) => t.status === s);
                return (
                  <div className="kanban-col" key={s}>
                    <div className="kanban-head">
                      <span className="kanban-title">{STATUS_LABEL[s]}</span>
                      <span className="kanban-count">{col.length}</span>
                    </div>
                    {col.length === 0 ? (
                      <div className="dim" style={{ fontSize: 13, padding: "8px 4px" }}>
                        No tasks
                      </div>
                    ) : (
                      col.map((t) => {
                        const member = state.members.find((m) => m.id === t.assigneeId);
                        const d = daysUntil(t.due);
                        return (
                          <div
                            key={t.id}
                            className="kanban-card"
                            role="button"
                            tabIndex={0}
                            onClick={() => setEditing(t)}
                            onKeyDown={(e) => e.key === "Enter" && setEditing(t)}
                          >
                            <div className="kanban-card-title">{t.title}</div>
                            <div className="flex items-center gap-8 wrap">
                              <Badge tone={STATUS_TONE[t.priority] as never}>{STATUS_LABEL[t.priority]}</Badge>
                              {t.status !== "done" && d < 0 ? <Badge tone="danger">OVERDUE</Badge> : null}
                            </div>
                            <div className="kanban-card-foot">
                              <span className="flex items-center gap-8">
                                <Avatar name={member?.name ?? "?"} size={24} />
                                <span className="kanban-card-meta">{member?.name ?? "—"}</span>
                              </span>
                              <span className="kanban-card-meta">{fmtDate(t.due)}</span>
                            </div>
                            <div className="flex gap-8 mt-8">
                              {s !== "done" ? (
                                <Button
                                  size="sm"
                                  className="btn-block"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const next = STATUS_ORDER[STATUS_ORDER.indexOf(s) + 1];
                                    updateTask(t.id, { status: next });
                                  }}
                                >
                                  Move to {STATUS_LABEL[STATUS_ORDER[STATUS_ORDER.indexOf(s) + 1]]}
                                  <IconChevronRight size={14} />
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <TaskModal task={editing} onClose={() => setEditing(null)} />
      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete task"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleting) deleteTask(deleting.id);
                setDeleting(null);
              }}
            >
              <IconTrash size={16} /> Delete
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 16 }}>
          Permanently delete <strong>{deleting?.title}</strong>? This removes it from the shared database and
          writes an entry to the activity log.
        </p>
      </Modal>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tone?: string;
}) {
  return (
    <button
      className={"filter-chip" + (active ? " filter-chip-active" : "")}
      onClick={onClick}
      aria-pressed={active}
      style={!active && tone ? { color: "var(--" + tone + ")" } : undefined}
    >
      {label}
    </button>
  );
}

function TaskModal({ task, onClose }: { task: Task | "new" | null; onClose: () => void }) {
  const { state, addTask, updateTask } = useStore();
  const isNew = task === "new";
  const current = isNew || task === null ? null : task;

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assigneeId, setAssigneeId] = useState(state.members[0]?.id ?? "");
  const [due, setDue] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!task) return;
    setTitle(current?.title ?? "");
    setStatus(current?.status ?? "todo");
    setPriority(current?.priority ?? "medium");
    setAssigneeId(current?.assigneeId ?? state.members[0]?.id ?? "");
    setDue(current ? current.due.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setTags(current?.tags.join(", ") ?? "");
    setNotes("");
  }, [task, current, state.members]);

  if (!task) return null;

  function save() {
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      status,
      priority,
      assigneeId: assigneeId || state.members[0]?.id || "",
      due: new Date(due + "T09:00:00").toISOString(),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    if (isNew) addTask(payload);
    else if (current) updateTask(current.id, payload);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "New task" : "Edit task"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!title.trim()}>
            <IconCheckSquare size={16} />
            {isNew ? "Create task" : "Save changes"}
          </Button>
        </>
      }
    >
      <Field label="Title">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Weld front bulkhead"
          autoFocus
        />
      </Field>
      <div className="form-grid">
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                {titleCase(p)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Assignee">
          <Select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            {state.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.position}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Due date">
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
      </div>
      <Field label="Tags" hint="Comma separated, e.g. CAD, FEA, Manufacturing">
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="CAD, DRW" />
      </Field>
      <Field label="Notes" hint="Optional context for the assignee">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Link to drawing, tolerance callout, weld map..." />
      </Field>
    </Modal>
  );
}
