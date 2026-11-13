export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type VendorStatus = "ordering" | "shipping" | "received" | "qc_passed" | "qc_failed";
export type MfgStatus = "waiting" | "cutting" | "welding" | "machining" | "done";
export type MilestoneStatus = "completed" | "pending" | "delayed" | "at-risk";
export type ActivityType =
  | "task"
  | "bom"
  | "member"
  | "milestone"
  | "upload"
  | "approve"
  | "meeting"
  | "reminder"
  | "error"
  | "system";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: "admin" | "engineer" | "viewer";
  position: string;
  subsystem: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  assigneeId: string;
  due: string;
  createdAt: string;
}

export interface BomPart {
  id: string;
  partName: string;
  partNumber: string;
  assembly: string;
  material: string;
  quantity: number;
  unitWeight: number;
  unitCost: number;
  vendorStatus: VendorStatus;
  mfgStatus: MfgStatus;
}

export interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  status: MilestoneStatus;
}

export interface FileItem {
  id: string;
  name: string;
  category: string;
  type: string;
  size: number;
  updatedAt: string;
}

export interface Activity {
  id: string;
  message: string;
  type: ActivityType;
  actorId: string;
  timestamp: string;
}

export interface SubsystemWeight {
  subsystem: string;
  budget: number;
  actual: number;
}

export interface WeightPoint {
  date: string;
  weight: number;
  note: string;
}

export interface Project {
  name: string;
  season: string;
  competitionDate: string;
  targetWeight: number;
  currentWeight: number;
  subsystemWeights: SubsystemWeight[];
  weightHistory: WeightPoint[];
  materialMix: { material: string; share: number }[];
}

export interface DataState {
  project: Project;
  members: Member[];
  tasks: Task[];
  bom: BomPart[];
  milestones: Milestone[];
  files: FileItem[];
  activity: Activity[];
}
