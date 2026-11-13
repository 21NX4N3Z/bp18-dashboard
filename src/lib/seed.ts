import type { DataState, Member, Task, BomPart, Milestone, FileItem, Activity } from "./types";

type MemberSeed = Omit<Member, "id">;
type TaskSeed = Omit<Task, "id">;
type BomSeed = Omit<BomPart, "id">;
type MilestoneSeed = Omit<Milestone, "id">;
type FileSeed = Omit<FileItem, "id">;
type ActivitySeed = Omit<Activity, "id">;

function iso(daysFromNow: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/** Fresh id every call, so a reset never collides with already-synced rows. */
function rid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "id_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/**
 * Seed dataset for the FSAE 2026 season.
 * Ids are generated per call (not hardcoded) so the same seed can be re-inserted
 * after a wipe without primary-key collisions in Supabase.
 */
export function buildSeed(): DataState {
  const memberSeed: MemberSeed[] = [
    { name: "X4N3Z", email: "muazzinnimah@gmail.com", role: "admin", position: "Frame & Body Lead", subsystem: "Chassis" },
    { name: "Prae", email: "prae@fsae.local", role: "engineer", position: "Welding Lead", subsystem: "Chassis" },
    { name: "Pond", email: "pond@fsae.local", role: "engineer", position: "Analysis Engineer", subsystem: "Impact Structures" },
    { name: "Bank", email: "bank@fsae.local", role: "engineer", position: "CAD Designer", subsystem: "Body Panels" },
    { name: "Film", email: "film@fsae.local", role: "engineer", position: "Manufacturing", subsystem: "Suspension Mounts" },
    { name: "Mild", email: "mild@fsae.local", role: "engineer", position: "QC Inspector", subsystem: "Chassis" },
    { name: "June", email: "june@fsae.local", role: "viewer", position: "Documenter", subsystem: "" },
    { name: "Tle", email: "tle@fsae.local", role: "engineer", position: "FEA Engineer", subsystem: "Impact Structures" },
    { name: "Nok", email: "nok@fsae.local", role: "engineer", position: "Composite Tech", subsystem: "Body Panels" },
    { name: "Aim", email: "aim@fsae.local", role: "engineer", position: "Suspension Design", subsystem: "Suspension" },
  ];
  const members: Member[] = memberSeed.map((m) => ({ id: rid(), ...m }));

  const [x4n3z, prae, pond, bank, film, mild, june, tle, nok, aim] = members;

  const taskSeed: TaskSeed[] = [
    { title: "Design main hoop", status: "in-progress", priority: "critical", tags: ["CAD"], assigneeId: x4n3z.id, due: iso(6), createdAt: iso(-20) },
    { title: "FEA on impact structure", status: "todo", priority: "high", tags: ["FEA"], assigneeId: pond.id, due: iso(9), createdAt: iso(-18) },
    { title: "Detail drawing set", status: "review", priority: "medium", tags: ["DRW"], assigneeId: bank.id, due: iso(-3), createdAt: iso(-22) },
    { title: "Weld front bulkhead", status: "in-progress", priority: "high", tags: ["Manufacturing"], assigneeId: prae.id, due: iso(14), createdAt: iso(-15) },
    { title: "Roll hoop bracing FEA", status: "todo", priority: "medium", tags: ["FEA"], assigneeId: tle.id, due: iso(11), createdAt: iso(-12) },
    { title: "Side impact bar cutting", status: "done", priority: "medium", tags: ["Manufacturing"], assigneeId: film.id, due: iso(-6), createdAt: iso(-25) },
    { title: "Body panel mold prep", status: "todo", priority: "low", tags: ["Manufacturing"], assigneeId: bank.id, due: iso(34), createdAt: iso(-8) },
    { title: "QC weld inspection batch 1", status: "review", priority: "high", tags: ["Manufacturing", "QC"], assigneeId: mild.id, due: iso(18), createdAt: iso(-10) },
    { title: "Update BOM cost sheet", status: "todo", priority: "low", tags: ["DRW"], assigneeId: x4n3z.id, due: iso(-2), createdAt: iso(-14) },
    { title: "Fixture design for jig", status: "in-progress", priority: "medium", tags: ["CAD"], assigneeId: prae.id, due: iso(16), createdAt: iso(-9) },
    { title: "Titanium bracket analysis", status: "todo", priority: "high", tags: ["FEA"], assigneeId: tle.id, due: iso(7), createdAt: iso(-7) },
    { title: "Final frame assembly", status: "todo", priority: "critical", tags: ["Manufacturing"], assigneeId: x4n3z.id, due: iso(30), createdAt: iso(-5) },
    { title: "Seat back laminate schedule", status: "done", priority: "medium", tags: ["Composite"], assigneeId: nok.id, due: iso(-9), createdAt: iso(-30) },
    { title: "Floor panel trim & fit", status: "in-progress", priority: "medium", tags: ["Composite"], assigneeId: nok.id, due: iso(12), createdAt: iso(-6) },
    { title: "Suspension pickup FEA sign-off", status: "review", priority: "high", tags: ["FEA"], assigneeId: aim.id, due: iso(-1), createdAt: iso(-16) },
    { title: "Steering column bracket CAD", status: "todo", priority: "medium", tags: ["CAD"], assigneeId: bank.id, due: iso(20), createdAt: iso(-4) },
    { title: "Pedal box weld procedure", status: "todo", priority: "high", tags: ["Manufacturing"], assigneeId: prae.id, due: iso(22), createdAt: iso(-3) },
    { title: "Head impact pad test coupon", status: "todo", priority: "medium", tags: ["Test"], assigneeId: pond.id, due: iso(26), createdAt: iso(-2) },
    { title: "Harness routing clearance check", status: "done", priority: "low", tags: ["DRW"], assigneeId: mild.id, due: iso(-12), createdAt: iso(-28) },
    { title: "Weight budget review meeting", status: "todo", priority: "high", tags: ["Meeting"], assigneeId: x4n3z.id, due: iso(2), createdAt: iso(-1) },
    { title: "Diffuser support machining", status: "in-progress", priority: "medium", tags: ["Manufacturing"], assigneeId: film.id, due: iso(8), createdAt: iso(-11) },
    { title: "Evans (coolant) bracket redesign", status: "todo", priority: "low", tags: ["CAD"], assigneeId: aim.id, due: iso(40), createdAt: iso(-2) },
    { title: "Front bulkhead weld map v2", status: "done", priority: "high", tags: ["Manufacturing"], assigneeId: prae.id, due: iso(-15), createdAt: iso(-40) },
    { title: "Tech inspection doc pack", status: "todo", priority: "medium", tags: ["DRW"], assigneeId: june.id, due: iso(58), createdAt: iso(-1) },
  ];
  const tasks: Task[] = taskSeed.map((t) => ({ id: rid(), ...t }));

  const bomSeed: BomSeed[] = [
    { partName: "Main Hoop", partNumber: "BH-001", assembly: "Chassis", material: "Steel 4130", quantity: 1, unitWeight: 3200, unitCost: 1500, vendorStatus: "received", mfgStatus: "done" },
    { partName: "Front Bulkhead", partNumber: "BH-002", assembly: "Chassis", material: "Steel 4130", quantity: 1, unitWeight: 2800, unitCost: 1300, vendorStatus: "received", mfgStatus: "welding" },
    { partName: "Side Impact Bar", partNumber: "BH-003", assembly: "Impact Structures", material: "Alu 6061-T6", quantity: 2, unitWeight: 850, unitCost: 600, vendorStatus: "shipping", mfgStatus: "cutting" },
    { partName: "Roll Hoop Brace", partNumber: "BH-004", assembly: "Chassis", material: "Steel 4130", quantity: 2, unitWeight: 1100, unitCost: 700, vendorStatus: "received", mfgStatus: "cutting" },
    { partName: "Fuel Cell Enclosure", partNumber: "BD-001", assembly: "Body Panels", material: "Carbon fibre", quantity: 1, unitWeight: 1400, unitCost: 4200, vendorStatus: "ordering", mfgStatus: "waiting" },
    { partName: "Floor Panel", partNumber: "BD-002", assembly: "Body Panels", material: "Carbon fibre", quantity: 1, unitWeight: 900, unitCost: 3100, vendorStatus: "qc_passed", mfgStatus: "done" },
    { partName: "Suspension Mount L", partNumber: "SM-001", assembly: "Suspension", material: "Alu 6061-T6", quantity: 1, unitWeight: 620, unitCost: 450, vendorStatus: "received", mfgStatus: "done" },
    { partName: "Suspension Mount R", partNumber: "SM-002", assembly: "Suspension", material: "Alu 6061-T6", quantity: 1, unitWeight: 620, unitCost: 450, vendorStatus: "received", mfgStatus: "done" },
    { partName: "Steering Bracket", partNumber: "SB-001", assembly: "Steering", material: "Alu 6061-T6", quantity: 1, unitWeight: 340, unitCost: 280, vendorStatus: "shipping", mfgStatus: "cutting" },
    { partName: "Pedal Box Frame", partNumber: "PB-001", assembly: "Chassis", material: "Steel 4130", quantity: 1, unitWeight: 1500, unitCost: 900, vendorStatus: "ordering", mfgStatus: "waiting" },
    { partName: "Seat Back Structure", partNumber: "BS-001", assembly: "Seats", material: "Carbon fibre", quantity: 1, unitWeight: 1100, unitCost: 3800, vendorStatus: "qc_failed", mfgStatus: "waiting" },
    { partName: "Diffuser Support", partNumber: "BD-003", assembly: "Body Panels", material: "Alu 6061-T6", quantity: 2, unitWeight: 480, unitCost: 320, vendorStatus: "received", mfgStatus: "cutting" },
    { partName: "Nose Impact Attenuator", partNumber: "IA-001", assembly: "Impact Structures", material: "Alu 6061-T6", quantity: 1, unitWeight: 1900, unitCost: 1150, vendorStatus: "received", mfgStatus: "machining" },
    { partName: "Head Restraint Pad", partNumber: "BS-002", assembly: "Seats", material: "Carbon fibre", quantity: 1, unitWeight: 700, unitCost: 640, vendorStatus: "received", mfgStatus: "done" },
    { partName: "Steering Column Tube", partNumber: "SB-002", assembly: "Steering", material: "Steel 4130", quantity: 1, unitWeight: 890, unitCost: 410, vendorStatus: "received", mfgStatus: "welding" },
    { partName: "Upright L", partNumber: "SN-001", assembly: "Suspension", material: "Alu 7075-T6", quantity: 1, unitWeight: 540, unitCost: 890, vendorStatus: "shipping", mfgStatus: "machining" },
    { partName: "Upright R", partNumber: "SN-002", assembly: "Suspension", material: "Alu 7075-T6", quantity: 1, unitWeight: 540, unitCost: 890, vendorStatus: "shipping", mfgStatus: "machining" },
    { partName: "Sidepod Panel L", partNumber: "BD-004", assembly: "Body Panels", material: "Carbon fibre", quantity: 1, unitWeight: 620, unitCost: 1450, vendorStatus: "ordering", mfgStatus: "waiting" },
    { partName: "Sidepod Panel R", partNumber: "BD-005", assembly: "Body Panels", material: "Carbon fibre", quantity: 1, unitWeight: 620, unitCost: 1450, vendorStatus: "ordering", mfgStatus: "waiting" },
    { partName: "Engine Mount Set", partNumber: "EN-001", assembly: "Chassis", material: "Steel 4130", quantity: 4, unitWeight: 260, unitCost: 210, vendorStatus: "received", mfgStatus: "done" },
  ];
  const bom: BomPart[] = bomSeed.map((b) => ({ id: rid(), ...b }));

  const milestoneSeed: MilestoneSeed[] = [
    { name: "Project Kickoff", dueDate: iso(-75), status: "completed" },
    { name: "Concept Design Review", dueDate: iso(-66), status: "completed" },
    { name: "Design Freeze", dueDate: iso(-42), status: "completed" },
    { name: "FEA Validation Sign-off", dueDate: iso(-12), status: "delayed" },
    { name: "Manufacturing Start", dueDate: iso(-2), status: "completed" },
    { name: "Frame Welding Complete", dueDate: iso(33), status: "pending" },
    { name: "Body Panel Layup Complete", dueDate: iso(48), status: "at-risk" },
    { name: "Assembly & Integration", dueDate: iso(64), status: "pending" },
    { name: "Static Event — Tech Inspection", dueDate: iso(92), status: "pending" },
    { name: "Competition — Endurance", dueDate: iso(102), status: "pending" },
  ];
  const milestones: Milestone[] = milestoneSeed.map((m) => ({ id: rid(), ...m }));

  const fileSeed: FileSeed[] = [
    { name: "Main_Hoop_v3.step", category: "CAD", type: "CAD", size: 4200000, updatedAt: iso(-4) },
    { name: "Impact_FEA_Report.pdf", category: "FEA", type: "FEA Report", size: 2800000, updatedAt: iso(-9) },
    { name: "BOM_Cost_Sheet.xlsx", category: "BOM", type: "BOM", size: 540000, updatedAt: iso(-2) },
    { name: "Welding_Procedure_WPS-01.pdf", category: "Manufacturing", type: "DRW", size: 1200000, updatedAt: iso(-14) },
    { name: "Side_Impact_Bar_dwg.pdf", category: "Manufacturing", type: "DRW", size: 980000, updatedAt: iso(-6) },
    { name: "Frame_Assembly_v2.step", category: "CAD", type: "CAD", size: 6100000, updatedAt: iso(-1) },
    { name: "Layup_Schedule_BodyPanels.pdf", category: "Composite", type: "DRW", size: 760000, updatedAt: iso(-11) },
    { name: "Suspension_Pickup_FEA.pdf", category: "FEA", type: "FEA Report", size: 3400000, updatedAt: iso(-3) },
    { name: "Weight_Budget_2026.xlsx", category: "BOM", type: "BOM", size: 410000, updatedAt: iso(0) },
    { name: "Tech_Inspection_Checklist.pdf", category: "Docs", type: "DRW", size: 890000, updatedAt: iso(-18) },
  ];
  const files: FileItem[] = fileSeed.map((f) => ({ id: rid(), ...f }));

  const activitySeed: ActivitySeed[] = [
    { message: "Weight budget review meeting scheduled", type: "meeting", actorId: x4n3z.id, timestamp: iso(-1, 8) },
    { message: "Uploaded Weight_Budget_2026.xlsx", type: "upload", actorId: x4n3z.id, timestamp: iso(0, 7) },
    { message: "FEA on impact structure approved", type: "approve", actorId: tle.id, timestamp: iso(-2, 16) },
    { message: "Seat Back Structure QC failed — rework needed", type: "error", actorId: mild.id, timestamp: iso(-3, 11) },
    { message: "Diffuser support machining started", type: "task", actorId: film.id, timestamp: iso(-3, 9) },
    { message: "Uploaded Suspension_Pickup_FEA.pdf", type: "upload", actorId: aim.id, timestamp: iso(-3, 8) },
    { message: "Side impact bar cutting completed", type: "approve", actorId: film.id, timestamp: iso(-6, 15) },
    { message: "Frame welding 60% complete", type: "reminder", actorId: prae.id, timestamp: iso(-4, 17) },
    { message: "Fuel cell enclosure ordered", type: "bom", actorId: x4n3z.id, timestamp: iso(-5, 10) },
    { message: "Body panel mold prep kicked off", type: "task", actorId: bank.id, timestamp: iso(-8, 9) },
    { message: "Welding procedure document uploaded", type: "upload", actorId: prae.id, timestamp: iso(-14, 14) },
    { message: "Design review meeting held — freeze confirmed", type: "meeting", actorId: x4n3z.id, timestamp: iso(-42, 13) },
    { message: "Front bulkhead weld map v2 released", type: "approve", actorId: prae.id, timestamp: iso(-15, 12) },
    { message: "Project BP18 created", type: "system", actorId: x4n3z.id, timestamp: iso(-75, 9) },
  ];
  const activity: Activity[] = activitySeed.map((a) => ({ id: rid(), ...a }));

  return {
    project: {
      name: "BP18",
      season: "FSAE 2026",
      competitionDate: iso(102),
      targetWeight: 55,
      currentWeight: 46.8,
      subsystemWeights: [
        { subsystem: "Chassis", budget: 22, actual: 19.4 },
        { subsystem: "Impact Structures", budget: 10, actual: 9.2 },
        { subsystem: "Suspension", budget: 8, actual: 7.1 },
        { subsystem: "Body Panels", budget: 9, actual: 6.8 },
        { subsystem: "Steering", budget: 3, actual: 2.1 },
        { subsystem: "Seats", budget: 3, actual: 2.2 },
      ],
      weightHistory: [
        { date: iso(-84), weight: 0, note: "Baseline — design start" },
        { date: iso(-56), weight: 15.2, note: "Main hoop + front bulkhead" },
        { date: iso(-35), weight: 28.6, note: "Impact structures added" },
        { date: iso(-14), weight: 36.1, note: "Suspension mounts fitted" },
        { date: iso(-4), weight: 41.3, note: "Frame welding 60%" },
        { date: iso(0), weight: 46.8, note: "Body panels started" },
      ],
      materialMix: [
        { material: "Steel 4130", share: 22.5 },
        { material: "Alu 6061-T6", share: 14.2 },
        { material: "Carbon fibre", share: 10.1 },
      ],
    },
    members,
    tasks,
    bom,
    milestones,
    files,
    activity,
  };
}
