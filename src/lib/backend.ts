import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Activity,
  BomPart,
  DataState,
  FileItem,
  Member,
  Milestone,
  Project,
  Task,
} from "./types";
import { buildSeed } from "./seed";

/* ============================================================================
 * Postgres row shapes (mirror supabase/schema.sql)
 * ==========================================================================*/

export interface MemberRow {
  id: string;
  name: string;
  email: string;
  role: string;
  position: string;
  subsystem: string;
  created_at: string;
}

export interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  tags: string[];
  assignee_id: string | null;
  due: string | null;
  created_at: string;
  updated_at: string;
}

export interface BomRow {
  id: string;
  part_name: string;
  part_number: string;
  assembly: string;
  material: string;
  quantity: number;
  unit_weight: number;
  unit_cost: number;
  vendor_status: string;
  mfg_status: string;
  created_at: string;
  updated_at: string;
}

export interface MilestoneRow {
  id: string;
  name: string;
  due_date: string | null;
  status: string;
  created_at: string;
}

export interface FileRow {
  id: string;
  name: string;
  category: string;
  type: string;
  size: number;
  updated_at: string;
}

export interface ActivityRow {
  id: string;
  message: string;
  type: string;
  actor_id: string | null;
  timestamp: string;
}

export interface ProjectRow {
  id: number;
  name: string;
  season: string;
  competition_date: string | null;
  target_weight: number;
  current_weight: number;
  subsystem_weights: Project["subsystemWeights"];
  weight_history: Project["weightHistory"];
  material_mix: Project["materialMix"];
  updated_at: string;
}

/* ============================================================================
 * Mappers
 * ==========================================================================*/

export function rowToMember(r: MemberRow): Member {
  return { id: r.id, name: r.name, email: r.email, role: r.role as Member["role"], position: r.position, subsystem: r.subsystem };
}
export function memberToRow(m: Member): MemberRow {
  return { id: m.id, name: m.name, email: m.email, role: m.role, position: m.position, subsystem: m.subsystem, created_at: new Date().toISOString() };
}

export function rowToTask(r: TaskRow): Task {
  return {
    id: r.id,
    title: r.title,
    status: r.status as Task["status"],
    priority: r.priority as Task["priority"],
    tags: r.tags ?? [],
    assigneeId: r.assignee_id ?? "",
    due: r.due ?? "",
    createdAt: r.created_at,
  };
}
export function taskToRow(t: Task): TaskRow {
  const now = new Date().toISOString();
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    tags: t.tags,
    assignee_id: t.assigneeId || null,
    due: t.due || null,
    created_at: t.createdAt || now,
    updated_at: now,
  };
}

export function rowToBom(r: BomRow): BomPart {
  return {
    id: r.id,
    partName: r.part_name,
    partNumber: r.part_number,
    assembly: r.assembly,
    material: r.material,
    quantity: r.quantity,
    unitWeight: r.unit_weight,
    unitCost: r.unit_cost,
    vendorStatus: r.vendor_status as BomPart["vendorStatus"],
    mfgStatus: r.mfg_status as BomPart["mfgStatus"],
  };
}
export function bomToRow(b: BomPart): BomRow {
  const now = new Date().toISOString();
  return {
    id: b.id,
    part_name: b.partName,
    part_number: b.partNumber,
    assembly: b.assembly,
    material: b.material,
    quantity: b.quantity,
    unit_weight: b.unitWeight,
    unit_cost: b.unitCost,
    vendor_status: b.vendorStatus,
    mfg_status: b.mfgStatus,
    created_at: now,
    updated_at: now,
  };
}

export function rowToMilestone(r: MilestoneRow): Milestone {
  return { id: r.id, name: r.name, dueDate: r.due_date ?? "", status: r.status as Milestone["status"] };
}
export function milestoneToRow(m: Milestone): MilestoneRow {
  return { id: m.id, name: m.name, due_date: m.dueDate || null, status: m.status, created_at: new Date().toISOString() };
}

export function rowToFile(r: FileRow): FileItem {
  return { id: r.id, name: r.name, category: r.category, type: r.type, size: Number(r.size), updatedAt: r.updated_at };
}
export function fileToRow(f: FileItem): FileRow {
  return { id: f.id, name: f.name, category: f.category, type: f.type, size: f.size, updated_at: f.updatedAt || new Date().toISOString() };
}

export function rowToActivity(r: ActivityRow): Activity {
  return { id: r.id, message: r.message, type: r.type as Activity["type"], actorId: r.actor_id ?? "", timestamp: r.timestamp };
}
export function activityToRow(a: Activity): ActivityRow {
  return { id: a.id, message: a.message, type: a.type, actor_id: a.actorId || null, timestamp: a.timestamp || new Date().toISOString() };
}

export function rowToProject(r: ProjectRow): Project {
  return {
    name: r.name,
    season: r.season,
    competitionDate: r.competition_date ?? "",
    targetWeight: Number(r.target_weight),
    currentWeight: Number(r.current_weight),
    subsystemWeights: r.subsystem_weights ?? [],
    weightHistory: r.weight_history ?? [],
    materialMix: r.material_mix ?? [],
  };
}
export function projectToRow(p: Project): ProjectRow {
  return {
    id: 1,
    name: p.name,
    season: p.season,
    competition_date: p.competitionDate || null,
    target_weight: p.targetWeight,
    current_weight: p.currentWeight,
    subsystem_weights: p.subsystemWeights,
    weight_history: p.weightHistory,
    material_mix: p.materialMix,
    updated_at: new Date().toISOString(),
  };
}

/* ============================================================================
 * Load
 * ==========================================================================*/

export async function loadAll(sb: SupabaseClient): Promise<DataState> {
  const [members, tasks, bom, milestones, files, activity, project] = await Promise.all([
    sb.from("app_members").select("*").order("created_at"),
    sb.from("app_tasks").select("*").order("created_at"),
    sb.from("app_bom_parts").select("*").order("created_at"),
    sb.from("app_milestones").select("*").order("created_at"),
    sb.from("app_files").select("*").order("updated_at"),
    sb.from("app_activity").select("*").order("timestamp", { ascending: false }).limit(200),
    sb.from("app_project").select("*").eq("id", 1).maybeSingle(),
  ]);

  for (const [label, res] of [
    ["members", members],
    ["tasks", tasks],
    ["bom", bom],
    ["milestones", milestones],
    ["files", files],
    ["activity", activity],
  ] as const) {
    if (res.error) throw new Error(`loading ${label}: ${res.error.message}`);
  }
  if (project.error) throw new Error(`loading project: ${project.error.message}`);

  const seed = buildSeed();

  // A fresh database has no project row yet — write the seed project so the
  // backend is self-consistent before the first user mutation.
  if (!project.data) {
    await sb.from("app_project").upsert(projectToRow(seed.project), { onConflict: "id" });
  }

  return {
    project: project.data ? rowToProject(project.data as ProjectRow) : seed.project,
    members: (members.data as MemberRow[]).map(rowToMember),
    tasks: (tasks.data as TaskRow[]).map(rowToTask),
    bom: (bom.data as BomRow[]).map(rowToBom),
    milestones: (milestones.data as MilestoneRow[]).map(rowToMilestone),
    files: (files.data as FileRow[]).map(rowToFile),
    activity: (activity.data as ActivityRow[]).map(rowToActivity),
  };
}

/* ============================================================================
 * Diff sync — the store only ever hands us (prev, next)
 * ==========================================================================*/

function diffById<T extends { id: string }>(prev: T[], next: T[]) {
  const prevMap = new Map(prev.map((x) => [x.id, x]));
  const nextMap = new Map(next.map((x) => [x.id, x]));
  const insert: T[] = [];
  const update: T[] = [];
  const remove: string[] = [];
  for (const item of next) {
    const before = prevMap.get(item.id);
    if (!before) insert.push(item);
    else if (JSON.stringify(before) !== JSON.stringify(item)) update.push(item);
  }
  for (const item of prev) if (!nextMap.has(item.id)) remove.push(item.id);
  return { insert, update, remove };
}

async function run(
  sb: SupabaseClient,
  table: string,
  ops: { insert?: unknown[]; update?: unknown[]; remove?: string[] }
) {
  const asRows = (rows: unknown[]) => rows as Record<string, unknown>[];
  if (ops.insert?.length) {
    const { error } = await sb.from(table).upsert(asRows(ops.insert), { onConflict: "id" });
    if (error) throw new Error(`${table} upsert: ${error.message}`);
  }
  if (ops.update?.length) {
    const { error } = await sb.from(table).upsert(asRows(ops.update), { onConflict: "id" });
    if (error) throw new Error(`${table} update: ${error.message}`);
  }
  if (ops.remove?.length) {
    const { error } = await sb.from(table).delete().in("id", ops.remove);
    if (error) throw new Error(`${table} delete: ${error.message}`);
  }
}

/** Push a whole state change. Order respects foreign keys both ways. */
export async function syncDiff(sb: SupabaseClient, prev: DataState, next: DataState): Promise<void> {
  const members = diffById(prev.members, next.members);
  const tasks = diffById(prev.tasks, next.tasks);
  const bom = diffById(prev.bom, next.bom);
  const milestones = diffById(prev.milestones, next.milestones);
  const files = diffById(prev.files, next.files);
  const activity = diffById(prev.activity, next.activity);
  const projectChanged = JSON.stringify(prev.project) !== JSON.stringify(next.project);

  // children first on delete, parents first on write
  await run(sb, "app_activity", { remove: activity.remove });
  await run(sb, "app_tasks", { remove: tasks.remove });
  await run(sb, "app_bom_parts", { remove: bom.remove });
  await run(sb, "app_files", { remove: files.remove });
  await run(sb, "app_milestones", { remove: milestones.remove });
  await run(sb, "app_members", { remove: members.remove });

  await run(sb, "app_members", {
    insert: members.insert.map(memberToRow),
    update: members.update.map(memberToRow),
  });

  if (projectChanged) {
    const { error } = await sb.from("app_project").upsert(projectToRow(next.project), { onConflict: "id" });
    if (error) throw new Error(`app_project upsert: ${error.message}`);
  }

  await run(sb, "app_milestones", {
    insert: milestones.insert.map(milestoneToRow),
    update: milestones.update.map(milestoneToRow),
  });
  await run(sb, "app_files", {
    insert: files.insert.map(fileToRow),
    update: files.update.map(fileToRow),
  });
  await run(sb, "app_bom_parts", {
    insert: bom.insert.map(bomToRow),
    update: bom.update.map(bomToRow),
  });
  await run(sb, "app_tasks", {
    insert: tasks.insert.map(taskToRow),
    update: tasks.update.map(taskToRow),
  });
  await run(sb, "app_activity", {
    insert: activity.insert.map(activityToRow),
    update: activity.update.map(activityToRow),
  });
}

/* ============================================================================
 * Reset / clear / stats / connection test
 * ==========================================================================*/

export async function resetToSeed(sb: SupabaseClient): Promise<DataState> {
  const seed = buildSeed();
  await syncDiff(sb, await loadAll(sb), seed);
  return seed;
}

export async function clearAll(sb: SupabaseClient): Promise<void> {
  await syncDiff(sb, await loadAll(sb), {
    project: buildSeed().project,
    members: [],
    tasks: [],
    bom: [],
    milestones: [],
    files: [],
    activity: [],
  });
}

export interface TableStat {
  table: string;
  label: string;
  rows: number;
}

export async function tableStats(sb: SupabaseClient): Promise<TableStat[]> {
  const tables: { table: string; label: string }[] = [
    { table: "app_members", label: "Members" },
    { table: "app_tasks", label: "Tasks" },
    { table: "app_bom_parts", label: "BOM parts" },
    { table: "app_milestones", label: "Milestones" },
    { table: "app_files", label: "Files" },
    { table: "app_activity", label: "Activity" },
    { table: "app_project", label: "Project" },
  ];
  const out: TableStat[] = [];
  for (const t of tables) {
    const { count, error } = await sb.from(t.table).select("*", { count: "exact", head: true });
    if (error) throw new Error(`${t.table} count: ${error.message}`);
    out.push({ table: t.table, label: t.label, rows: count ?? 0 });
  }
  return out;
}

export interface ConnectionResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
  schemaReady: boolean;
  rowCounts?: TableStat[];
}

/** Cheap round trip plus a schema probe. */
export async function testConnection(sb: SupabaseClient): Promise<ConnectionResult> {
  const started = performance.now();
  try {
    const { error } = await sb.from("app_project").select("id").limit(1);
    const latencyMs = Math.round(performance.now() - started);
    if (error) {
      // 42P01 = relation does not exist -> schema not applied yet
      const missing = error.code === "42P01";
      return { ok: false, latencyMs, error: error.message, schemaReady: !missing };
    }
    const rowCounts = await tableStats(sb);
    return { ok: true, latencyMs, schemaReady: true, rowCounts };
  } catch (e) {
    return { ok: false, latencyMs: Math.round(performance.now() - started), error: String(e), schemaReady: false };
  }
}
