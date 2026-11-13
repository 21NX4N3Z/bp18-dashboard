export const TASK_STATUSES = ["todo", "in-progress", "review", "done"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export const VENDOR_STATUSES = ["ordering", "shipping", "received", "qc_passed", "qc_failed"] as const;
export const MFG_STATUSES = ["waiting", "cutting", "welding", "machining", "done"] as const;
export const MILESTONE_STATUSES = ["completed", "pending", "delayed", "at-risk"] as const;

export const STATUS_LABEL: Record<string, string> = {
  todo: "TODO",
  "in-progress": "IN PROGRESS",
  review: "REVIEW",
  done: "DONE",
  low: "LOW",
  medium: "MED",
  high: "HIGH",
  critical: "CRIT",
  ordering: "ORDERING",
  shipping: "SHIPPING",
  received: "RECEIVED",
  qc_passed: "QC PASS",
  qc_failed: "QC FAIL",
  waiting: "WAITING",
  cutting: "CUTTING",
  welding: "WELDING",
  machining: "MACHINING",
  completed: "COMPLETED",
  pending: "PENDING",
  delayed: "DELAYED",
  "at-risk": "AT RISK",
};

export const STATUS_TONE: Record<string, "ok" | "warn" | "danger" | "info" | "dim"> = {
  todo: "dim",
  "in-progress": "info",
  review: "warn",
  done: "ok",
  low: "dim",
  medium: "info",
  high: "warn",
  critical: "danger",
  ordering: "warn",
  shipping: "info",
  received: "ok",
  qc_passed: "ok",
  qc_failed: "danger",
  waiting: "dim",
  cutting: "info",
  welding: "warn",
  machining: "info",
  completed: "ok",
  pending: "dim",
  delayed: "danger",
  "at-risk": "warn",
};

export function titleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function fmtNum(n: number, dp = 0): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export function fmtMoney(n: number): string {
  return "฿" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function fmtWeight(n: number, dp = 1): string {
  return fmtNum(n, dp);
}

export function fmtSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return (
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) +
    " " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

export function daysUntil(iso: string): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  const now = new Date();
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / 86400000);
}

export function relTime(iso: string): string {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const diff = Date.now() - d;
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60000);
  const hr = Math.round(abs / 3600000);
  const day = Math.round(abs / 86400000);
  const suffix = diff >= 0 ? "ago" : "from now";
  if (min < 60) return min <= 0 ? "just now" : min + "m " + suffix;
  if (hr < 24) return hr + "h " + suffix;
  if (day < 30) return day + "d " + suffix;
  return Math.round(day / 30) + "mo " + suffix;
}

export function uid(prefix = "id"): string {
  return prefix + "_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

export function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}
