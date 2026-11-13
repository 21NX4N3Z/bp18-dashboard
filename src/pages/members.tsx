import { useEffect, useMemo, useState } from "react";
import { useStore } from "../lib/store";
import type { Member } from "../lib/types";
import { memberWorkload } from "../lib/derive";
import { STATUS_LABEL, STATUS_TONE } from "../lib/format";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, IconButton, Input, Modal, Progress, Select } from "../components/ui";
import { IconEdit, IconPlus, IconTrash, IconUsers } from "../components/icons";

const SUBSYSTEMS = ["Chassis", "Impact Structures", "Suspension", "Body Panels", "Steering", "Seats", ""];

export function MembersPage() {
  const { state, deleteMember } = useStore();
  const [query, setQuery] = useState("");
  const [subsystem, setSubsystem] = useState("all");
  const [editing, setEditing] = useState<Member | "new" | null>(null);
  const [deleting, setDeleting] = useState<Member | null>(null);

  const workload = useMemo(() => memberWorkload(state), [state]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workload.filter((w) => {
      if (subsystem !== "all" && w.member.subsystem !== subsystem) return false;
      if (q && !w.member.name.toLowerCase().includes(q) && !w.member.position.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [workload, query, subsystem]);

  const engineers = state.members.filter((m) => m.role !== "viewer").length;
  const open = state.tasks.filter((t) => t.status !== "done").length;
  const avgLoad = state.members.length ? Math.round(workload.reduce((s, w) => s + w.open, 0) / state.members.length) : 0;

  return (
    <>
      <div className="kpi-grid">
        <Card className="kpi">
          <div className="kpi-label">Roster</div>
          <div className="kpi-value">{state.members.length}</div>
          <div className="kpi-foot">
            <span className="dim">{engineers} engineers · {state.members.length - engineers} support</span>
          </div>
        </Card>
        <Card className="kpi">
          <div className="kpi-label">Open tasks</div>
          <div className="kpi-value">{open}</div>
          <div className="kpi-foot">
            <span className="dim">across {state.members.length} people</span>
          </div>
        </Card>
        <Card className="kpi">
          <div className="kpi-label">Average load</div>
          <div className="kpi-value t-warn">{avgLoad}</div>
          <div className="kpi-foot">
            <span className="dim">open tasks per member</span>
          </div>
        </Card>
        <Card className="kpi">
          <div className="kpi-label">Critical holders</div>
          <div className="kpi-value t-danger">
            {workload.filter((w) => w.critical > 0).length}
          </div>
          <div className="kpi-foot">
            <span className="dim">members holding critical work</span>
          </div>
        </Card>
      </div>

      <Card className="card-flush">
        <div style={{ padding: 20 }}>
          <CardHeader
            title="Roster"
            subtitle="Roles, subsystems and current load"
            icon={<IconUsers size={18} />}
            actions={
              <Button variant="primary" onClick={() => setEditing("new")}>
                <IconPlus size={16} />
                Add member
              </Button>
            }
          />
          <div className="filter-bar">
            <div className="search-box">
              <input
                placeholder="Search name or position..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search members"
              />
            </div>
            <Select value={subsystem} onChange={(e) => setSubsystem(e.target.value)} aria-label="Filter by subsystem" style={{ width: 200, minHeight: 40 }}>
              <option value="all">All subsystems</option>
              {SUBSYSTEMS.filter(Boolean).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No members match" hint="Adjust the filters or add a teammate." />
        ) : (
          <div style={{ padding: "0 20px 20px" }}>
            <div className="member-grid">
              {rows.map((w) => (
                <div className="member-card" key={w.member.id}>
                  <Avatar name={w.member.name} size={44} />
                  <div className="member-card-body">
                    <div className="member-name">{w.member.name}</div>
                    <div className="member-role">
                      {w.member.position}
                      {w.member.subsystem ? " · " + w.member.subsystem : ""}
                    </div>
                    <div className="member-load">
                      <div className="member-load-row">
                        <span>OPEN {w.open}</span>
                        <span>CRIT {w.critical}</span>
                        <span>DONE {w.done}</span>
                      </div>
                      <Progress value={w.load} tone={w.load > 80 ? "danger" : w.load > 55 ? "warn" : "ok"} height={8} />
                    </div>
                    <div className="flex gap-8 mt-8">
                      <Badge tone={w.member.role === "admin" ? "info" : w.member.role === "viewer" ? "dim" : "ok"}>
                        {STATUS_LABEL[w.member.role] ?? w.member.role.toUpperCase()}
                      </Badge>
                      <div className="grow" />
                      <IconButton label={"Edit " + w.member.name} onClick={() => setEditing(w.member)}>
                        <IconEdit size={14} />
                      </IconButton>
                      <IconButton
                        label={"Remove " + w.member.name}
                        onClick={() => {
                          if (state.tasks.some((t) => t.assigneeId === w.member.id)) {
                            setDeleting(w.member);
                          } else {
                            deleteMember(w.member.id);
                          }
                        }}
                      >
                        <IconTrash size={14} />
                      </IconButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <MemberModal member={editing} onClose={() => setEditing(null)} />
      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Remove member"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleting) deleteMember(deleting.id);
                setDeleting(null);
              }}
            >
              <IconTrash size={16} /> Remove
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 16 }}>
          <strong>{deleting?.name}</strong> still owns tasks. Removing them leaves those tasks unassigned — reassign
          them first, or remove anyway and handle the orphans in the task board.
        </p>
      </Modal>
    </>
  );
}

function MemberModal({ member, onClose }: { member: Member | "new" | null; onClose: () => void }) {
  const { addMember, updateMember, state } = useStore();
  const isNew = member === "new";
  const current = isNew || member === null ? null : member;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [subsystem, setSubsystem] = useState("");
  const [role, setRole] = useState<Member["role"]>("engineer");

  useEffect(() => {
    if (!member) return;
    setName(current?.name ?? "");
    setEmail(current?.email ?? "");
    setPosition(current?.position ?? "");
    setSubsystem(current?.subsystem ?? "");
    setRole(current?.role ?? "engineer");
  }, [member, current]);

  if (!member) return null;

  const emailTaken = state.members.some((m) => m.email.toLowerCase() === email.trim().toLowerCase() && m.id !== current?.id);

  function save() {
    if (!name.trim() || !email.trim()) return;
    const payload = { name: name.trim(), email: email.trim(), position: position.trim(), subsystem, role };
    if (isNew) addMember(payload);
    else if (current) updateMember(current.id, payload);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Add member" : "Edit member"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!name.trim() || !email.trim()}>
            <IconPlus size={16} />
            {isNew ? "Add member" : "Save changes"}
          </Button>
        </>
      }
    >
      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Prae" autoFocus />
      </Field>
      <div className="form-grid">
        <Field label="Email" hint={emailTaken ? "Already on the roster" : undefined}>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prae@fsae.local" type="email" />
        </Field>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value as Member["role"])}>
            <option value="engineer">Engineer</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </Select>
        </Field>
        <Field label="Position">
          <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Welding Lead" />
        </Field>
        <Field label="Subsystem">
          <Select value={subsystem} onChange={(e) => setSubsystem(e.target.value)}>
            <option value="">Unassigned</option>
            {SUBSYSTEMS.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
