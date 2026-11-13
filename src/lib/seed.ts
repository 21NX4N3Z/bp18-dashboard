import type { DataState } from "./types";

function iso(daysFromNow: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function buildSeed(): DataState {
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

    members: [
      { id: "m1", name: "X4N3Z", email: "muazzinnimah@gmail.com", role: "admin", position: "Frame & Body Lead", subsystem: "Chassis" },
      { id: "m2", name: "Prae", email: "prae@fsae.local", role: "engineer", position: "Welding Lead", subsystem: "Chassis" },
      { id: "m3", name: "Pond", email: "pond@fsae.local", role: "engineer", position: "Analysis Engineer", subsystem: "Impact Structures" },
      { id: "m4", name: "Bank", email: "bank@fsae.local", role: "engineer", position: "CAD Designer", subsystem: "Body Panels" },
      { id: "m5", name: "Film", email: "film@fsae.local", role: "engineer", position: "Manufacturing", subsystem: "Suspension Mounts" },
      { id: "m6", name: "Mild", email: "mild@fsae.local", role: "engineer", position: "QC Inspector", subsystem: "Chassis" },
      { id: "m7", name: "June", email: "june@fsae.local", role: "viewer", position: "Documenter", subsystem: "" },
      { id: "m8", name: "Tle", email: "tle@fsae.local", role: "engineer", position: "FEA Engineer", subsystem: "Impact Structures" },
      { id: "m9", name: "Nok", email: "nok@fsae.local", role: "engineer", position: "Composite Tech", subsystem: "Body Panels" },
      { id: "m10", name: "Aim", email: "aim@fsae.local", role: "engineer", position: "Suspension Design", subsystem: "Suspension" },
    ],

    tasks: [
      { id: "t1", title: "Design main hoop", status: "in-progress", priority: "critical", tags: ["CAD"], assigneeId: "m1", due: iso(6), createdAt: iso(-20) },
      { id: "t2", title: "FEA on impact structure", status: "todo", priority: "high", tags: ["FEA"], assigneeId: "m3", due: iso(9), createdAt: iso(-18) },
      { id: "t3", title: "Detail drawing set", status: "review", priority: "medium", tags: ["DRW"], assigneeId: "m4", due: iso(-3), createdAt: iso(-22) },
      { id: "t4", title: "Weld front bulkhead", status: "in-progress", priority: "high", tags: ["Manufacturing"], assigneeId: "m2", due: iso(14), createdAt: iso(-15) },
      { id: "t5", title: "Roll hoop bracing FEA", status: "todo", priority: "medium", tags: ["FEA"], assigneeId: "m8", due: iso(11), createdAt: iso(-12) },
      { id: "t6", title: "Side impact bar cutting", status: "done", priority: "medium", tags: ["Manufacturing"], assigneeId: "m5", due: iso(-6), createdAt: iso(-25) },
      { id: "t7", title: "Body panel mold prep", status: "todo", priority: "low", tags: ["Manufacturing"], assigneeId: "m4", due: iso(34), createdAt: iso(-8) },
      { id: "t8", title: "QC weld inspection batch 1", status: "review", priority: "high", tags: ["Manufacturing", "QC"], assigneeId: "m6", due: iso(18), createdAt: iso(-10) },
      { id: "t9", title: "Update BOM cost sheet", status: "todo", priority: "low", tags: ["DRW"], assigneeId: "m1", due: iso(-2), createdAt: iso(-14) },
      { id: "t10", title: "Fixture design for jig", status: "in-progress", priority: "medium", tags: ["CAD"], assigneeId: "m2", due: iso(16), createdAt: iso(-9) },
      { id: "t11", title: "Titanium bracket analysis", status: "todo", priority: "high", tags: ["FEA"], assigneeId: "m8", due: iso(7), createdAt: iso(-7) },
      { id: "t12", title: "Final frame assembly", status: "todo", priority: "critical", tags: ["Manufacturing"], assigneeId: "m1", due: iso(30), createdAt: iso(-5) },
      { id: "t13", title: "Seat back laminate schedule", status: "done", priority: "medium", tags: ["Composite"], assigneeId: "m9", due: iso(-9), createdAt: iso(-30) },
      { id: "t14", title: "Floor panel trim & fit", status: "in-progress", priority: "medium", tags: ["Composite"], assigneeId: "m9", due: iso(12), createdAt: iso(-6) },
      { id: "t15", title: "Suspension pickup FEA sign-off", status: "review", priority: "high", tags: ["FEA"], assigneeId: "m10", due: iso(-1), createdAt: iso(-16) },
      { id: "t16", title: "Steering column bracket CAD", status: "todo", priority: "medium", tags: ["CAD"], assigneeId: "m4", due: iso(20), createdAt: iso(-4) },
      { id: "t17", title: "Pedal box weld procedure", status: "todo", priority: "high", tags: ["Manufacturing"], assigneeId: "m2", due: iso(22), createdAt: iso(-3) },
      { id: "t18", title: "Head impact pad test coupon", status: "todo", priority: "medium", tags: ["Test"], assigneeId: "m3", due: iso(26), createdAt: iso(-2) },
      { id: "t19", title: "Harness routing clearance check", status: "done", priority: "low", tags: ["DRW"], assigneeId: "m6", due: iso(-12), createdAt: iso(-28) },
      { id: "t20", title: "Weight budget review meeting", status: "todo", priority: "high", tags: ["Meeting"], assigneeId: "m1", due: iso(2), createdAt: iso(-1) },
      { id: "t21", title: "Diffuser support machining", status: "in-progress", priority: "medium", tags: ["Manufacturing"], assigneeId: "m5", due: iso(8), createdAt: iso(-11) },
      { id: "t22", title: "Evans (coolant) bracket redesign", status: "todo", priority: "low", tags: ["CAD"], assigneeId: "m10", due: iso(40), createdAt: iso(-2) },
      { id: "t23", title: "Front bulkhead weld map v2", status: "done", priority: "high", tags: ["Manufacturing"], assigneeId: "m2", due: iso(-15), createdAt: iso(-40) },
      { id: "t24", title: "Tech inspection doc pack", status: "todo", priority: "medium", tags: ["DRW"], assigneeId: "m7", due: iso(58), createdAt: iso(-1) },
    ],

    bom: [
      { id: "b1", partName: "Main Hoop", partNumber: "BH-001", assembly: "Chassis", material: "Steel 4130", quantity: 1, unitWeight: 3200, unitCost: 1500, vendorStatus: "received", mfgStatus: "done" },
      { id: "b2", partName: "Front Bulkhead", partNumber: "BH-002", assembly: "Chassis", material: "Steel 4130", quantity: 1, unitWeight: 2800, unitCost: 1300, vendorStatus: "received", mfgStatus: "welding" },
      { id: "b3", partName: "Side Impact Bar", partNumber: "BH-003", assembly: "Impact Structures", material: "Alu 6061-T6", quantity: 2, unitWeight: 850, unitCost: 600, vendorStatus: "shipping", mfgStatus: "cutting" },
      { id: "b4", partName: "Roll Hoop Brace", partNumber: "BH-004", assembly: "Chassis", material: "Steel 4130", quantity: 2, unitWeight: 1100, unitCost: 700, vendorStatus: "received", mfgStatus: "cutting" },
      { id: "b5", partName: "Fuel Cell Enclosure", partNumber: "BD-001", assembly: "Body Panels", material: "Carbon fibre", quantity: 1, unitWeight: 1400, unitCost: 4200, vendorStatus: "ordering", mfgStatus: "waiting" },
      { id: "b6", partName: "Floor Panel", partNumber: "BD-002", assembly: "Body Panels", material: "Carbon fibre", quantity: 1, unitWeight: 900, unitCost: 3100, vendorStatus: "qc_passed", mfgStatus: "done" },
      { id: "b7", partName: "Suspension Mount L", partNumber: "SM-001", assembly: "Suspension", material: "Alu 6061-T6", quantity: 1, unitWeight: 620, unitCost: 450, vendorStatus: "received", mfgStatus: "done" },
      { id: "b8", partName: "Suspension Mount R", partNumber: "SM-002", assembly: "Suspension", material: "Alu 6061-T6", quantity: 1, unitWeight: 620, unitCost: 450, vendorStatus: "received", mfgStatus: "done" },
      { id: "b9", partName: "Steering Bracket", partNumber: "SB-001", assembly: "Steering", material: "Alu 6061-T6", quantity: 1, unitWeight: 340, unitCost: 280, vendorStatus: "shipping", mfgStatus: "cutting" },
      { id: "b10", partName: "Pedal Box Frame", partNumber: "PB-001", assembly: "Chassis", material: "Steel 4130", quantity: 1, unitWeight: 1500, unitCost: 900, vendorStatus: "ordering", mfgStatus: "waiting" },
      { id: "b11", partName: "Seat Back Structure", partNumber: "BS-001", assembly: "Seats", material: "Carbon fibre", quantity: 1, unitWeight: 1100, unitCost: 3800, vendorStatus: "qc_failed", mfgStatus: "waiting" },
      { id: "b12", partName: "Diffuser Support", partNumber: "BD-003", assembly: "Body Panels", material: "Alu 6061-T6", quantity: 2, unitWeight: 480, unitCost: 320, vendorStatus: "received", mfgStatus: "cutting" },
      { id: "b13", partName: "Nose Impact Attenuator", partNumber: "IA-001", assembly: "Impact Structures", material: "Alu 6061-T6", quantity: 1, unitWeight: 1900, unitCost: 1150, vendorStatus: "received", mfgStatus: "machining" },
      { id: "b14", partName: "Head Restraint Pad", partNumber: "BS-002", assembly: "Seats", material: "Carbon fibre", quantity: 1, unitWeight: 700, unitCost: 640, vendorStatus: "received", mfgStatus: "done" },
      { id: "b15", partName: "Steering Column Tube", partNumber: "SB-002", assembly: "Steering", material: "Steel 4130", quantity: 1, unitWeight: 890, unitCost: 410, vendorStatus: "received", mfgStatus: "welding" },
      { id: "b16", partName: "Upright L", partNumber: "SN-001", assembly: "Suspension", material: "Alu 7075-T6", quantity: 1, unitWeight: 540, unitCost: 890, vendorStatus: "shipping", mfgStatus: "machining" },
      { id: "b17", partName: "Upright R", partNumber: "SN-002", assembly: "Suspension", material: "Alu 7075-T6", quantity: 1, unitWeight: 540, unitCost: 890, vendorStatus: "shipping", mfgStatus: "machining" },
      { id: "b18", partName: "Sidepod Panel L", partNumber: "BD-004", assembly: "Body Panels", material: "Carbon fibre", quantity: 1, unitWeight: 620, unitCost: 1450, vendorStatus: "ordering", mfgStatus: "waiting" },
      { id: "b19", partName: "Sidepod Panel R", partNumber: "BD-005", assembly: "Body Panels", material: "Carbon fibre", quantity: 1, unitWeight: 620, unitCost: 1450, vendorStatus: "ordering", mfgStatus: "waiting" },
      { id: "b20", partName: "Engine Mount Set", partNumber: "EN-001", assembly: "Chassis", material: "Steel 4130", quantity: 4, unitWeight: 260, unitCost: 210, vendorStatus: "received", mfgStatus: "done" },
    ],

    milestones: [
      { id: "ms1", name: "Project Kickoff", dueDate: iso(-75), status: "completed" },
      { id: "ms2", name: "Concept Design Review", dueDate: iso(-66), status: "completed" },
      { id: "ms3", name: "Design Freeze", dueDate: iso(-42), status: "completed" },
      { id: "ms4", name: "FEA Validation Sign-off", dueDate: iso(-12), status: "delayed" },
      { id: "ms5", name: "Manufacturing Start", dueDate: iso(-2), status: "completed" },
      { id: "ms6", name: "Frame Welding Complete", dueDate: iso(33), status: "pending" },
      { id: "ms7", name: "Body Panel Layup Complete", dueDate: iso(48), status: "at-risk" },
      { id: "ms8", name: "Assembly & Integration", dueDate: iso(64), status: "pending" },
      { id: "ms9", name: "Static Event — Tech Inspection", dueDate: iso(92), status: "pending" },
      { id: "ms10", name: "Competition — Endurance", dueDate: iso(102), status: "pending" },
    ],

    files: [
      { id: "f1", name: "Main_Hoop_v3.step", category: "CAD", type: "CAD", size: 4200000, updatedAt: iso(-4) },
      { id: "f2", name: "Impact_FEA_Report.pdf", category: "FEA", type: "FEA Report", size: 2800000, updatedAt: iso(-9) },
      { id: "f3", name: "BOM_Cost_Sheet.xlsx", category: "BOM", type: "BOM", size: 540000, updatedAt: iso(-2) },
      { id: "f4", name: "Welding_Procedure_WPS-01.pdf", category: "Manufacturing", type: "DRW", size: 1200000, updatedAt: iso(-14) },
      { id: "f5", name: "Side_Impact_Bar_dwg.pdf", category: "Manufacturing", type: "DRW", size: 980000, updatedAt: iso(-6) },
      { id: "f6", name: "Frame_Assembly_v2.step", category: "CAD", type: "CAD", size: 6100000, updatedAt: iso(-1) },
      { id: "f7", name: "Layup_Schedule_BodyPanels.pdf", category: "Composite", type: "DRW", size: 760000, updatedAt: iso(-11) },
      { id: "f8", name: "Suspension_Pickup_FEA.pdf", category: "FEA", type: "FEA Report", size: 3400000, updatedAt: iso(-3) },
      { id: "f9", name: "Weight_Budget_2026.xlsx", category: "BOM", type: "BOM", size: 410000, updatedAt: iso(0) },
      { id: "f10", name: "Tech_Inspection_Checklist.pdf", category: "Docs", type: "DRW", size: 890000, updatedAt: iso(-18) },
    ],

    activity: [
      { id: "a1", message: "Weight budget review meeting scheduled", type: "meeting", actorId: "m1", timestamp: iso(-1, 8) },
      { id: "a2", message: "Uploaded Weight_Budget_2026.xlsx", type: "upload", actorId: "m1", timestamp: iso(0, 7) },
      { id: "a3", message: "FEA on impact structure approved", type: "approve", actorId: "m8", timestamp: iso(-2, 16) },
      { id: "a4", message: "Seat Back Structure QC failed — rework needed", type: "error", actorId: "m6", timestamp: iso(-3, 11) },
      { id: "a5", message: "Diffuser support machining started", type: "task", actorId: "m5", timestamp: iso(-3, 9) },
      { id: "a6", message: "Uploaded Suspension_Pickup_FEA.pdf", type: "upload", actorId: "m10", timestamp: iso(-3, 8) },
      { id: "a7", message: "Side impact bar cutting completed", type: "approve", actorId: "m5", timestamp: iso(-6, 15) },
      { id: "a8", message: "Frame welding 60% complete", type: "reminder", actorId: "m2", timestamp: iso(-4, 17) },
      { id: "a9", message: "Fuel cell enclosure ordered", type: "bom", actorId: "m1", timestamp: iso(-5, 10) },
      { id: "a10", message: "Body panel mold prep kicked off", type: "task", actorId: "m4", timestamp: iso(-8, 9) },
      { id: "a11", message: "Welding procedure document uploaded", type: "upload", actorId: "m2", timestamp: iso(-14, 14) },
      { id: "a12", message: "Design review meeting held — freeze confirmed", type: "meeting", actorId: "m1", timestamp: iso(-42, 13) },
      { id: "a13", message: "Front bulkhead weld map v2 released", type: "approve", actorId: "m2", timestamp: iso(-15, 12) },
      { id: "a14", message: "Project BP18 created", type: "system", actorId: "m1", timestamp: iso(-75, 9) },
    ],
  };
}
