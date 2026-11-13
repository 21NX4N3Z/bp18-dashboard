import type { DataState, Task, TaskPriority, TaskStatus } from "./types";
import { daysUntil } from "./format";

export interface Kpis {
  totalTasks: number;
  doneTasks: number;
  openTasks: number;
  critOpen: number;
  overdue: number;
  dueSoon: number;
  progress: number;
  totalCost: number;
  partCount: number;
  totalWeight: number;
  qcFail: number;
  mfgDone: number;
  mfgActive: number;
  budgetTotal: number;
  actualTotal: number;
  weightDelta: number;
  daysToComp: number;
  milestoneDone: number;
  milestoneTotal: number;
  delayed: number;
  atRisk: number;
}

export function computeKpis(state: DataState): Kpis {
  const { tasks, bom, project, milestones } = state;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const openTasks = totalTasks - doneTasks;
  const critOpen = tasks.filter((t) => t.priority === "critical" && t.status !== "done").length;
  const overdue = tasks.filter((t) => t.status !== "done" && daysUntil(t.due) < 0).length;
  const dueSoon = tasks.filter((t) => {
    const d = daysUntil(t.due);
    return t.status !== "done" && d >= 0 && d <= 7;
  }).length;

  const totalCost = bom.reduce((s, b) => s + b.unitCost * b.quantity, 0);
  const totalWeight = bom.reduce((s, b) => s + b.unitWeight * b.quantity, 0) / 1000;
  const qcFail = bom.filter((b) => b.vendorStatus === "qc_failed").length;
  const mfgDone = bom.filter((b) => b.mfgStatus === "done").length;
  const mfgActive = bom.filter((b) => ["cutting", "welding", "machining"].includes(b.mfgStatus)).length;

  const budgetTotal = project.subsystemWeights.reduce((s, w) => s + w.budget, 0);
  const actualTotal = project.subsystemWeights.reduce((s, w) => s + w.actual, 0);

  const milestoneDone = milestones.filter((m) => m.status === "completed").length;

  return {
    totalTasks,
    doneTasks,
    openTasks,
    critOpen,
    overdue,
    dueSoon,
    progress: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
    totalCost,
    partCount: bom.length,
    totalWeight,
    qcFail,
    mfgDone,
    mfgActive,
    budgetTotal,
    actualTotal,
    weightDelta: Math.round((actualTotal - budgetTotal) * 10) / 10,
    daysToComp: daysUntil(project.competitionDate),
    milestoneDone,
    milestoneTotal: milestones.length,
    delayed: milestones.filter((m) => m.status === "delayed").length,
    atRisk: milestones.filter((m) => m.status === "at-risk").length,
  };
}

export function statusItems(state: DataState): { label: string; value: number; color: string }[] {
  const order: TaskStatus[] = ["todo", "in-progress", "review", "done"];
  const colors: Record<TaskStatus, string> = {
    todo: "var(--text-3)",
    "in-progress": "var(--accent)",
    review: "var(--warn)",
    done: "var(--ok)",
  };
  return order.map((s) => ({
    label: s.toUpperCase(),
    value: state.tasks.filter((t) => t.status === s).length,
    color: colors[s],
  }));
}

export function priorityItems(state: DataState): { label: string; value: number; tone: "accent" | "ok" | "warn" | "danger" }[] {
  const order: TaskPriority[] = ["low", "medium", "high", "critical"];
  const tone: Record<TaskPriority, "accent" | "ok" | "warn" | "danger"> = {
    low: "accent",
    medium: "ok",
    high: "warn",
    critical: "danger",
  };
  return order.map((p) => ({
    label: p.toUpperCase(),
    value: state.tasks.filter((t) => t.priority === p && t.status !== "done").length,
    tone: tone[p],
  }));
}

export function tagItems(state: DataState): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const t of state.tasks) {
    if (t.status === "done") continue;
    for (const tag of t.tags) map.set(tag, (map.get(tag) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export function assigneeItems(state: DataState): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const t of state.tasks) {
    if (t.status === "done") continue;
    const m = state.members.find((x) => x.id === t.assigneeId);
    const name = m ? m.name : "Unassigned";
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function costByAssembly(state: DataState): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const b of state.bom) map.set(b.assembly, (map.get(b.assembly) ?? 0) + b.unitCost * b.quantity);
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function costByMaterial(state: DataState): { label: string; value: number; color: string }[] {
  const palette = ["var(--accent)", "var(--ok)", "var(--warn)", "var(--danger)", "var(--text-3)"];
  const map = new Map<string, number>();
  for (const b of state.bom) map.set(b.material, (map.get(b.material) ?? 0) + b.unitCost * b.quantity);
  return Array.from(map.entries())
    .map(([label, value], i) => ({ label, value, color: palette[i % palette.length] }))
    .sort((a, b) => b.value - a.value);
}

export function weightByAssembly(state: DataState): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const b of state.bom) {
    map.set(b.assembly, (map.get(b.assembly) ?? 0) + (b.unitWeight * b.quantity) / 1000);
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value: Math.round(value * 10) / 10 }))
    .sort((a, b) => b.value - a.value);
}

export function vendorItems(state: DataState): { label: string; value: number; color: string }[] {
  const defs: { key: string; label: string; color: string }[] = [
    { key: "received", label: "RECEIVED", color: "var(--ok)" },
    { key: "qc_passed", label: "QC PASS", color: "var(--ok)" },
    { key: "shipping", label: "SHIPPING", color: "var(--accent)" },
    { key: "ordering", label: "ORDERING", color: "var(--warn)" },
    { key: "qc_failed", label: "QC FAIL", color: "var(--danger)" },
  ];
  return defs.map((d) => ({
    label: d.label,
    color: d.color,
    value: state.bom.filter((b) => b.vendorStatus === d.key).length,
  }));
}

export function mfgItems(state: DataState): { label: string; value: number; tone: "accent" | "ok" | "warn" | "danger" }[] {
  const defs: { key: string; label: string; tone: "accent" | "ok" | "warn" | "danger" }[] = [
    { key: "waiting", label: "WAITING", tone: "accent" },
    { key: "cutting", label: "CUTTING", tone: "warn" },
    { key: "machining", label: "MACHINING", tone: "warn" },
    { key: "welding", label: "WELDING", tone: "danger" },
    { key: "done", label: "DONE", tone: "ok" },
  ];
  return defs.map((d) => ({
    label: d.label,
    tone: d.tone,
    value: state.bom.filter((b) => b.mfgStatus === d.key).length,
  }));
}

export function materialMixItems(state: DataState): { label: string; value: number; color: string }[] {
  const palette = ["var(--accent)", "var(--ok)", "var(--warn)", "var(--danger)", "var(--text-3)"];
  return state.project.materialMix.map((m, i) => ({
    label: m.material,
    value: m.share,
    color: palette[i % palette.length],
  }));
}

export function milestoneItems(state: DataState): { label: string; value: number; color: string }[] {
  const defs: { key: string; label: string; color: string }[] = [
    { key: "completed", label: "COMPLETED", color: "var(--ok)" },
    { key: "pending", label: "PENDING", color: "var(--text-3)" },
    { key: "at-risk", label: "AT RISK", color: "var(--warn)" },
    { key: "delayed", label: "DELAYED", color: "var(--danger)" },
  ];
  return defs.map((d) => ({
    label: d.label,
    color: d.color,
    value: state.milestones.filter((m) => m.status === d.key).length,
  }));
}

export function activityItems(state: DataState): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const a of state.activity) map.set(a.type, (map.get(a.type) ?? 0) + 1);
  return Array.from(map.entries())
    .map(([label, value]) => ({ label: label.toUpperCase(), value }))
    .sort((a, b) => b.value - a.value);
}

export function dueLoadItems(state: DataState): { label: string; value: number }[] {
  const buckets = [
    { label: "OVERDUE", test: (d: number) => d < 0 },
    { label: "THIS WK", test: (d: number) => d >= 0 && d <= 7 },
    { label: "WK 2", test: (d: number) => d > 7 && d <= 14 },
    { label: "WK 3-4", test: (d: number) => d > 14 && d <= 28 },
    { label: "LATER", test: (d: number) => d > 28 },
  ];
  return buckets.map((b) => ({
    label: b.label,
    value: state.tasks.filter((t) => t.status !== "done" && b.test(daysUntil(t.due))).length,
  }));
}

export function memberWorkload(state: DataState): {
  member: DataState["members"][number];
  open: number;
  critical: number;
  done: number;
  load: number;
}[] {
  return state.members
    .map((member) => {
      const own = state.tasks.filter((t) => t.assigneeId === member.id);
      const open = own.filter((t) => t.status !== "done").length;
      const critical = own.filter((t) => t.priority === "critical" && t.status !== "done").length;
      const done = own.filter((t) => t.status === "done").length;
      return { member, open, critical, done, load: Math.min(100, Math.round((open / 6) * 100)) };
    })
    .sort((a, b) => b.open - a.open);
}

export function criticalTasks(state: DataState): Task[] {
  return state.tasks
    .filter((t) => t.status !== "done" && (t.priority === "critical" || daysUntil(t.due) < 0))
    .sort((a, b) => daysUntil(a.due) - daysUntil(b.due));
}

export function recentActivity(state: DataState, n = 8) {
  return state.activity.slice(0, n);
}
