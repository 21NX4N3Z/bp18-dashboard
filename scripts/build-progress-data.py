"""
Build a DataState JSON from the Black Pearl progress report
(Progress_13Nov2026.pdf, 352 pages) for import into the BP18 dashboard.

Output: data/bp18-progress-2026.json

Ids are UUIDv5 derived from a stable key, so re-running this script produces the
same ids and re-importing upserts instead of duplicating.

Status mapping (from the report's own words):
  Done / DONE / Complete / Finish / 100%          -> done
  In process / In Process / Inprogress / WIP       -> in-progress
  Not done / Not started / Not start / Waiting    -> todo
  FAIL / blocked                                   -> in-progress (flagged)
"""
import json
import uuid
from pathlib import Path

NS = uuid.NAMESPACE_URL


def uid(key: str) -> str:
    return str(uuid.uuid5(NS, "bp18:" + key))


def iso(y, m, d, h=9):
    return f"{y:04d}-{m:02d}-{d:02d}T{h:02d}:00:00.000Z"


# --------------------------------------------------------------------------
# Members
# --------------------------------------------------------------------------
# key, name, role, position, subsystem
MEMBERS = [
    ("prin", "Prin", "engineer", "Frame Simulation & Aero", "Chassis"),
    ("pruk", "Pruk", "engineer", "Manufacturing & Frame Layout", "Chassis"),
    ("dutch", "Dutch", "engineer", "Suspension CNC & Brackets", "Suspension"),
    ("dave", "Dave", "engineer", "Rear Wheel Drivetrain", "Powertrain"),
    ("ikq", "Ikq", "engineer", "Front Wheel Drivetrain", "Powertrain"),
    ("kit", "Kit", "engineer", "Accumulator", "Powertrain"),
    ("tae", "Tae", "engineer", "Accumulator & Cooling", "Powertrain"),
    ("prob", "Prob", "engineer", "Accumulator", "Powertrain"),
    ("pao", "Pao", "engineer", "Accumulator", "Powertrain"),
    ("meow", "Meow", "engineer", "Accumulator", "Powertrain"),
    ("wan", "Wan T", "engineer", "Accumulator", "Powertrain"),
    ("jak", "Jak", "engineer", "Cooling System", "Powertrain"),
    ("apo", "Apo", "engineer", "Spacer Fardrive & Resolver Shaft", "Powertrain"),
    ("y1", "Y1", "engineer", "Powertrain", "Powertrain"),
    ("petch", "Petch", "engineer", "BMS / Battery Pack / Wiring Harness", "High Voltage"),
    ("guneng", "GunEng", "engineer", "BMS", "High Voltage"),
    ("peem", "Peem", "engineer", "BMS", "High Voltage"),
    ("pat", "Pat", "engineer", "BMS", "High Voltage"),
    ("fu", "Fu", "engineer", "BMS", "High Voltage"),
    ("to", "To", "engineer", "Wiring Harness", "High Voltage"),
    ("danai", "Prof. Danai", "viewer", "Wiring Harness Advisor", "High Voltage"),
    ("ck", "CK", "engineer", "Shutdown & TSAL Control", "Low Voltage"),
    ("joe", "Joe", "engineer", "BSPD", "Low Voltage"),
    ("pokpong", "Pokpong", "engineer", "VCU", "Low Voltage"),
    ("korn", "Korn", "engineer", "TSAL Light", "Low Voltage"),
    ("gao", "Gao", "engineer", "Telemetry ESP32 / CAN", "Systems"),
    ("npun", "N'Pun", "engineer", "Telemetry Display", "Systems"),
    ("toen", "Toen", "engineer", "Systems / Telemetry Operator", "Systems"),
    ("jackie", "Jackie", "engineer", "BOM & LV", "Low Voltage"),
    ("folk", "Folk", "engineer", "CAN Bus", "Systems"),
    ("lily", "Lily", "engineer", "Sensor Reading", "Systems"),
    ("pooh", "Pooh", "engineer", "Systems (workload transfer)", "Systems"),
    ("angy", "Angy", "admin", "General Management / Procurement", "General"),
    ("yuil", "Yuil", "engineer", "Data Logger", "Systems"),
    ("ling", "Ling", "viewer", "Business Plan", "General"),
    ("chamint", "P'Chamint", "viewer", "Finance Advisor", "General"),
    ("jubjang", "Jubjang", "viewer", "Procurement", "General"),
    ("nott", "Nott", "viewer", "Procurement", "General"),
    ("goody", "Goody", "viewer", "Data Gathering", "General"),
    ("ajarn", "Ajarn", "viewer", "Wiring Advisor", "General"),
]

members = [
    {"id": uid(k), "name": n, "email": "", "role": r, "position": p, "subsystem": s}
    for (k, n, r, p, s) in MEMBERS
]
by = {k: uid(k) for (k, *_rest) in MEMBERS}

# --------------------------------------------------------------------------
# Tasks
# --------------------------------------------------------------------------
# (key, title, status, priority, tags, assignee key, due, created)
TASKS = [
    # --- Frame & Body: manufacturing ---
    ("fb-bracket-weld", "Bracket welding (Drivetrain, Accum, Elec, Aero, MS, Body)", "todo", "high", ["Manufacturing"], "pruk", iso(2026, 11, 20), iso(2026, 9, 1)),
    ("fb-frame-paint", "Frame paint (start when welding finished)", "todo", "medium", ["Manufacturing"], "pruk", iso(2026, 12, 4), iso(2026, 9, 1)),
    ("fb-body-aero", "Body part & Aerodynamics - plug making", "in-progress", "high", ["Composite"], "prin", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("fb-torsion-sim", "Torsion simulation", "done", "high", ["FEA"], "prin", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("fb-modify-frame", "Modify frame to BP18 Ver.4", "done", "high", ["CAD"], "prin", iso(2026, 10, 30), iso(2026, 8, 1)),
    ("fb-aero-sim", "Aero simulation - 3D CFD (OpenFOAM multi-element)", "in-progress", "high", ["FEA"], "prin", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("fb-ia-600j", "Impact attenuator must pass 600 J (currently FAIL - 600 J to go)", "in-progress", "critical", ["Test", "Impact"], "prin", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("fb-cost-drawing", "Cost & Drawing (frame)", "done", "high", ["DRW"], "pruk", iso(2026, 9, 25), iso(2026, 8, 1)),
    ("fb-fr-aarm", "FR A-arm", "done", "high", ["CAD"], "dutch", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("fb-sliding-rail", "Sliding rail", "done", "medium", ["Manufacturing"], "pruk", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("fb-harness-frame", "Harness (frame side)", "in-progress", "medium", ["DRW"], "to", iso(2026, 11, 20), iso(2026, 9, 1)),
    ("fb-fr-decouple", "FR decouple", "done", "high", ["CAD"], "dutch", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("fb-rr-decouple", "RR decouple", "done", "high", ["CAD"], "dutch", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("fb-steering-sys", "Steering system (frame side)", "done", "high", ["CAD"], "pruk", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("fb-bamo", "Bamo bracket", "done", "medium", ["Manufacturing"], "pruk", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("fb-battery-bracket", "Battery bracket", "done", "medium", ["Manufacturing"], "pruk", iso(2026, 9, 30), iso(2026, 8, 1)),
    # --- Impact attenuator build ---
    ("ia-manu-mold", "IA manufacturing mould", "done", "medium", ["Manufacturing"], "pruk", iso(2026, 9, 14), iso(2026, 8, 1)),
    ("ia-pu-foam-order", "PU foam solution 6 kg - order", "done", "low", ["Procurement"], "pruk", iso(2026, 9, 10), iso(2026, 8, 1)),
    ("ia-manu", "IA manufacturing (1/2 complete)", "in-progress", "high", ["Manufacturing"], "pruk", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("ia-jig-design", "Front bulkhead jig design", "done", "medium", ["CAD"], "pruk", iso(2026, 9, 14), iso(2026, 8, 1)),
    ("ia-jig-material", "Jig material (MDF)", "done", "low", ["Procurement"], "pruk", iso(2026, 9, 14), iso(2026, 8, 1)),
    ("ia-jig-fab", "Jig fabrication (laser cut & 3D print)", "done", "medium", ["Manufacturing"], "pruk", iso(2026, 9, 14), iso(2026, 8, 1)),
    ("ia-front-material", "Front bulkhead material (PSP + old tube, AIP)", "done", "medium", ["Procurement"], "pruk", iso(2026, 9, 14), iso(2026, 8, 1)),
    ("ia-front-fab", "Front bulkhead fabrication", "todo", "high", ["Manufacturing"], "pruk", iso(2026, 11, 27), iso(2026, 9, 14)),
    ("ia-test-utm", "UTM compression test (14 September, afternoon half day)", "in-progress", "high", ["Test"], "prin", iso(2026, 9, 14), iso(2026, 8, 1)),
    ("ia-epoxy-glue", "IA design 2 sealing method (epoxy glue - best method)", "done", "medium", ["Design"], "prin", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("ia-pmi-foam", "Source TX-71 series PMI foam for impact attenuator", "in-progress", "high", ["Procurement"], "angy", iso(2026, 12, 4), iso(2026, 9, 1)),
    ("ia-cnc-quote", "Await manufacturing & shipping quote for 3 CNC-machined IA pieces", "in-progress", "high", ["Procurement"], "angy", iso(2026, 12, 4), iso(2026, 9, 1)),
    ("ia-pu-supplier", "Find PU foam supplier (Foamtec / Alibaba)", "in-progress", "medium", ["Procurement"], "angy", iso(2026, 12, 4), iso(2026, 9, 1)),
    ("ia-ansys-cubic", "Ansys Explicit Dynamics 80 kg/m3 cubic model", "done", "medium", ["FEA"], "prin", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("ia-impact-model", "Impact model (loading rate still being defined)", "todo", "medium", ["FEA"], "prin", iso(2026, 12, 4), iso(2026, 9, 1)),
    # --- Frame drawing / cost status ---
    ("drw-frame-60", "Frame drawing - 60/60 parts", "done", "high", ["DRW"], "pruk", iso(2026, 9, 23), iso(2026, 8, 1)),
    ("drw-bracket", "Bracket drawing", "todo", "high", ["DRW"], "pruk", iso(2026, 9, 23), iso(2026, 8, 1)),
    ("drw-misc", "Miscellaneous drawing", "todo", "medium", ["DRW"], "pruk", iso(2026, 9, 23), iso(2026, 8, 1)),
    ("drw-aeropart", "Aeropart drawing", "todo", "medium", ["DRW"], "prin", iso(2026, 9, 23), iso(2026, 8, 1)),
    ("asm-aeropart", "Aeropart assembly - 70/70 parts", "done", "high", ["Manufacturing"], "prin", iso(2026, 10, 30), iso(2026, 8, 1)),
    ("asm-bracket", "All bracket assembly - 22/40 parts done", "in-progress", "high", ["Manufacturing"], "pruk", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("brk-st", "ST bracket", "done", "medium", ["Manufacturing"], "pruk", iso(2026, 9, 23), iso(2026, 8, 1)),
    ("brk-cooling", "Cooling bracket", "done", "medium", ["Manufacturing"], "pruk", iso(2026, 9, 23), iso(2026, 8, 1)),
    ("brk-juncbox", "JuncBox bracket", "done", "medium", ["Manufacturing"], "pruk", iso(2026, 9, 23), iso(2026, 8, 1)),
    ("brk-motor-ctrl", "Motor controller bracket", "done", "medium", ["Manufacturing"], "pruk", iso(2026, 9, 23), iso(2026, 8, 1)),
    ("brk-aero", "Aero part & bracket", "done", "medium", ["Manufacturing"], "pruk", iso(2026, 9, 23), iso(2026, 8, 1)),
    ("brk-el", "EL bracket", "done", "medium", ["Manufacturing"], "pruk", iso(2026, 9, 23), iso(2026, 8, 1)),
    ("brk-drawing", "Bracket drawing (due 23/9)", "todo", "high", ["DRW"], "pruk", iso(2026, 9, 23), iso(2026, 8, 1)),
    ("brk-cost", "Bracket cost (due 25/9)", "todo", "high", ["DRW"], "pruk", iso(2026, 9, 25), iso(2026, 8, 1)),
    ("aero-design", "Aero design (3D sim done, ready to design)", "todo", "high", ["Design"], "prin", iso(2026, 12, 4), iso(2026, 9, 1)),
    ("fb-firewall", "Firewall", "done", "medium", ["Manufacturing"], "pruk", iso(2026, 9, 23), iso(2026, 8, 1)),
    ("fa-drw1", "Frame assembly drawing draft 1 (Ver.3) - 99%", "in-progress", "high", ["DRW"], "pruk", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("fa-cost1", "Frame assembly cost draft 1", "todo", "medium", ["DRW"], "pruk", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("fa-drw2", "Frame assembly drawing draft 2 (Ver.4) - 33%", "in-progress", "high", ["DRW"], "pruk", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("fa-cost2", "Frame assembly cost draft 2", "todo", "medium", ["DRW"], "pruk", iso(2026, 12, 10), iso(2026, 9, 1)),
    # --- Aero manufacturing ---
    ("am-fw-main", "Front wing mainplane (prepreg 600 gsm, 3 layers)", "in-progress", "high", ["Composite"], "prin", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("am-fw-flap", "Front wing flaps (prepreg 300 gsm, 2 layers)", "in-progress", "high", ["Composite"], "prin", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("am-fw-end", "Front wing endplates (birch plywood 3 mm)", "in-progress", "medium", ["Composite"], "prin", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("am-fw-mount", "Front wing mounts & brackets (aluminium/steel)", "in-progress", "medium", ["Manufacturing"], "prin", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("am-rw-main", "Rear wing mainplane (prepreg 600 gsm, 3 layers)", "in-progress", "high", ["Composite"], "prin", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("am-rw-flap", "Rear wing flaps (prepreg 300 gsm, 2 layers)", "in-progress", "high", ["Composite"], "prin", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("am-rw-end", "Rear wing endplates (prepreg 300 gsm / honeycomb)", "in-progress", "medium", ["Composite"], "prin", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("am-rw-mount", "Rear wing mounts & brackets", "in-progress", "medium", ["Manufacturing"], "prin", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("am-nose", "Nosecone outer shell (prepreg 300 gsm, 3 layers)", "in-progress", "high", ["Composite"], "prin", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("am-sidepod", "Sidepods (prepreg 300 gsm, 3 layers)", "in-progress", "high", ["Composite"], "prin", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("am-sidewing", "Side wings / deflectors", "in-progress", "medium", ["Composite"], "prin", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("am-sideplate", "Side plate (birch plywood 3 mm)", "in-progress", "medium", ["Composite"], "prin", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("am-floor", "Undertray floor (fiberglass 200 gsm + coremat)", "in-progress", "high", ["Composite"], "prin", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("am-diffuser", "Diffuser tunnel & fins (carbon prepreg / birch)", "in-progress", "high", ["Composite"], "prin", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("am-ut-bracket", "Undertray brackets (aluminium 6061-T6 / PETG)", "in-progress", "medium", ["Manufacturing"], "prin", iso(2026, 12, 10), iso(2026, 9, 1)),
    # --- Suspension ---
    ("sus-drawing", "Suspension drawing - 99%", "in-progress", "high", ["DRW"], "dutch", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("sus-cost", "Suspension cost - 0%", "todo", "high", ["DRW"], "dutch", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("sus-dcp-geo", "DCP geometry", "done", "high", ["CAD"], "dutch", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("sus-dcp-asm", "DCP assembly", "done", "high", ["Manufacturing"], "dutch", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("sus-dcp-fea", "DCP FEA", "done", "high", ["FEA"], "dutch", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("sus-simulink", "Simulink model", "done", "medium", ["Simulation"], "dutch", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("sus-dyn-calc", "Dynamics calculation", "done", "medium", ["Simulation"], "dutch", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("sus-aarm-cut", "A-arm aluminium cutting", "in-progress", "high", ["Manufacturing"], "dutch", iso(2026, 11, 20), iso(2026, 10, 1)),
    ("sus-aarm-cnc", "A-arm CNC machining", "todo", "high", ["Manufacturing"], "dutch", iso(2026, 11, 27), iso(2026, 10, 1)),
    ("sus-aarm-bend", "A-arm bending test", "todo", "high", ["Test"], "dutch", iso(2026, 11, 27), iso(2026, 10, 1)),
    ("sus-aarm-carbon", "A-arm & rod carbon manufacturing", "in-progress", "high", ["Composite"], "dutch", iso(2026, 12, 4), iso(2026, 10, 1)),
    ("sus-brake-asm", "Assemble brake system", "in-progress", "high", ["Manufacturing"], "dutch", iso(2026, 11, 20), iso(2026, 10, 1)),
    ("sus-steer-asm", "Assemble steering system", "in-progress", "high", ["Manufacturing"], "dutch", iso(2026, 11, 20), iso(2026, 10, 1)),
    ("sus-tag-weld", "Tag weld all suspension bracket", "todo", "high", ["Manufacturing"], "dutch", iso(2026, 12, 4), iso(2026, 10, 1)),
    ("sus-cnc", "CNC manufacturing", "in-progress", "high", ["Manufacturing"], "dutch", iso(2026, 12, 4), iso(2026, 10, 1)),
    # --- Brake ---
    ("brk-sys", "Brake system design", "in-progress", "high", ["Design"], "dutch", iso(2026, 12, 4), iso(2026, 9, 1)),
    ("brk-weight", "Brake weight reduction (3174 g -> 2567 g, -600 g)", "done", "high", ["Design"], "dutch", iso(2026, 10, 30), iso(2026, 8, 1)),
    ("brk-pedal", "Brake pedal design (ratio 1:5 / 1:7)", "in-progress", "high", ["Design"], "dutch", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("brk-cable", "Brake cable routing", "in-progress", "medium", ["Manufacturing"], "dutch", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("brk-pressure-sw", "Brake pressure switch", "in-progress", "medium", ["Procurement"], "angy", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("brk-disc-sim", "Brake disc simulation (T max 162.26 C)", "done", "medium", ["FEA"], "dutch", iso(2026, 10, 30), iso(2026, 8, 1)),
    ("brk-dyno", "Brake dynamometer DIY", "in-progress", "medium", ["Test"], "dutch", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("brk-cooling-opt", "Brake cooling optimization", "in-progress", "medium", ["Design"], "dutch", iso(2026, 12, 10), iso(2026, 9, 1)),
    # --- Steering ---
    ("str-sys", "Steering system", "done", "high", ["Design"], "dutch", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("str-asm", "Steering assembly", "in-progress", "high", ["Manufacturing"], "dutch", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("str-sensor", "Steering sensor", "in-progress", "high", ["Procurement"], "angy", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("str-bracket", "Steering bracket", "done", "medium", ["Manufacturing"], "dutch", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("str-drawing", "Steering drawing", "done", "high", ["DRW"], "dutch", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("str-cost", "Steering cost", "in-progress", "medium", ["DRW"], "dutch", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("str-pot", "Steering potentiometer (1-2 pcs, 92.69 THB)", "in-progress", "medium", ["Procurement"], "angy", iso(2026, 11, 20), iso(2026, 9, 1)),
    ("str-emg", "Emergency switch + BOTS (1-2 pcs, 155 THB)", "in-progress", "medium", ["Procurement"], "angy", iso(2026, 11, 20), iso(2026, 9, 1)),
    ("str-inertia", "Inertia switch (2-3 pcs, 131 THB)", "in-progress", "medium", ["Procurement"], "angy", iso(2026, 9, 14), iso(2026, 9, 1)),
    ("str-keyswitch", "Key switch", "in-progress", "medium", ["Procurement"], "angy", iso(2026, 11, 20), iso(2026, 9, 1)),
    # --- Powertrain ---
    ("pt-drawing", "Powertrain drawing - 80% (remaining cooling)", "in-progress", "high", ["DRW"], "dave", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("pt-cost", "Powertrain cost - 80%", "in-progress", "high", ["DRW"], "dave", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("pt-rw-dt", "Rear wheel drivetrain", "in-progress", "high", ["Design"], "dave", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("pt-fw-dt", "Front wheel drivetrain", "in-progress", "high", ["Design"], "ikq", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("pt-accum", "Accumulator", "in-progress", "high", ["Design"], "kit", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("pt-cooling", "Cooling system", "in-progress", "high", ["Design"], "jak", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("pt-lsd", "LSD overhaul", "done", "high", ["Manufacturing"], "dave", iso(2026, 10, 30), iso(2026, 8, 1)),
    ("pt-rw-dt-new", "New rear drivetrain", "done", "high", ["Manufacturing"], "dave", iso(2026, 10, 30), iso(2026, 8, 1)),
    ("pt-sprocket-mount", "Sprocket mounting topology (13 mm, SF 2.45)", "done", "high", ["FEA"], "dave", iso(2026, 10, 30), iso(2026, 8, 1)),
    ("pt-sprocket-carrier", "Sprocket carrier topology (SF 3.43, 174 g)", "done", "high", ["FEA"], "dave", iso(2026, 10, 30), iso(2026, 8, 1)),
    ("pt-motor-mount", "Motor mounting topology (13 mm, SF 6.79, 0.844 kg)", "done", "high", ["FEA"], "ikq", iso(2026, 10, 30), iso(2026, 8, 1)),
    ("pt-planet-gear", "Planet gear (stress error 0.5%, dynamic factor 208 MPa)", "in-progress", "high", ["FEA"], "dave", iso(2026, 12, 4), iso(2026, 9, 1)),
    ("pt-bracket", "Bracket (DT + ACC) - everyone, 13/11 (15/11)", "in-progress", "high", ["Manufacturing"], "angy", iso(2026, 11, 15), iso(2026, 11, 13)),
    ("pt-cnc-sprocket", "CNC front sprocket shaft", "in-progress", "high", ["Manufacturing"], "dave", iso(2026, 11, 13), iso(2026, 11, 13)),
    ("pt-spacer", "Spacer fardrive", "in-progress", "high", ["Manufacturing"], "apo", iso(2026, 11, 13), iso(2026, 11, 13)),
    ("pt-resolver", "Resolver shaft", "in-progress", "high", ["Manufacturing"], "apo", iso(2026, 11, 13), iso(2026, 11, 13)),
    ("pt-copper-cut", "Copper wire cut", "in-progress", "medium", ["Manufacturing"], "kit", iso(2026, 11, 13), iso(2026, 11, 13)),
    ("pt-accum-final", "Accumulator finalize", "in-progress", "high", ["Design"], "kit", iso(2026, 11, 27), iso(2026, 11, 13)),
    ("pt-bolt-list", "Bolt list - everyone, 15/11", "in-progress", "medium", ["DRW"], "angy", iso(2026, 11, 15), iso(2026, 11, 13)),
    ("pt-brd", "BRD (20/11, 27/11)", "in-progress", "high", ["DRW"], "angy", iso(2026, 11, 27), iso(2026, 11, 13)),
    # --- High voltage / BMS ---
    ("hv-bms-2of7", "BMS integration - 2 of 7 units wired and communicating", "in-progress", "critical", ["BMS"], "petch", iso(2026, 12, 4), iso(2026, 9, 6)),
    ("hv-bms-monitor", "Real-time BMS monitoring dashboard", "done", "medium", ["BMS"], "guneng", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("hv-bms-wifi", "Wi-Fi module local network for BMS telemetry", "done", "medium", ["BMS"], "guneng", iso(2026, 9, 30), iso(2026, 8, 1)),
    ("hv-bms-scale", "Full system scaling - remaining 5 BMS segments", "todo", "critical", ["BMS"], "petch", iso(2026, 12, 4), iso(2026, 9, 6)),
    ("hv-bms-sd", "Offline SD card data logging", "todo", "medium", ["BMS"], "petch", iso(2026, 12, 10), iso(2026, 9, 6)),
    ("hv-bms-amsok", "AMS_OK GPIO safety interlock", "todo", "high", ["BMS"], "petch", iso(2026, 12, 10), iso(2026, 9, 6)),
    ("hv-battery-pack", "Battery pack module build", "in-progress", "high", ["Manufacturing"], "petch", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("hv-bcu", "BCU development (from P'Tonn BCU)", "in-progress", "high", ["BMS"], "petch", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("hv-can-mon", "CAN battery monitoring & balance", "done", "high", ["BMS"], "petch", iso(2026, 11, 13), iso(2026, 11, 13)),
    ("hv-fuse-board", "PCB fuse board - 70% (schematic & PCB draft 1 done)", "in-progress", "high", ["Elec"], "petch", iso(2026, 12, 4), iso(2026, 9, 1)),
    ("hv-cad-clearance", "3D CAD accumulator container clearance", "in-progress", "medium", ["CAD"], "petch", iso(2026, 12, 4), iso(2026, 9, 1)),
    ("hv-connector", "Source main power connectors (Total+ / Total-)", "in-progress", "high", ["Procurement"], "angy", iso(2026, 12, 4), iso(2026, 9, 1)),
    ("hv-pole", "Battery +/- pole attach", "in-progress", "high", ["Manufacturing"], "petch", iso(2026, 12, 4), iso(2026, 9, 1)),
    ("hv-ultrasonic", "Ultrasonic weld (next week)", "todo", "high", ["Manufacturing"], "petch", iso(2026, 11, 20), iso(2026, 11, 13)),
    ("hv-inverter-dl", "Inverter datalog", "in-progress", "medium", ["Test"], "petch", iso(2026, 11, 27), iso(2026, 11, 13)),
    # --- Wiring harness ---
    ("wh-diagram", "Wiring harness diagram", "done", "high", ["DRW"], "to", iso(2026, 9, 14), iso(2026, 8, 1)),
    ("wh-cost", "Wiring harness cost (sponsor: Harness.design)", "done", "medium", ["DRW"], "to", iso(2026, 9, 25), iso(2026, 8, 1)),
    ("wh-lv-route", "LV route", "done", "medium", ["DRW"], "to", iso(2026, 9, 25), iso(2026, 8, 1)),
    ("wh-assign", "Assign harness to component (20/11)", "in-progress", "medium", ["DRW"], "to", iso(2026, 11, 20), iso(2026, 9, 1)),
    ("wh-netlist", "Netlist table (1st draft by Petch, deadline 7 Aug)", "in-progress", "high", ["DRW"], "petch", iso(2026, 12, 4), iso(2026, 8, 1)),
    ("wh-elec-diagram", "Electrical (LV/HV/system) diagram - deadline 14 Aug", "done", "high", ["DRW"], "to", iso(2026, 8, 14), iso(2026, 8, 1)),
    ("wh-location", "Component location with body & frame - deadline 14 Aug", "done", "medium", ["DRW"], "to", iso(2026, 8, 14), iso(2026, 8, 1)),
    ("wh-rapid", "Rapid harness - deadline 14 Aug, extended 28 Aug", "done", "medium", ["Manufacturing"], "to", iso(2026, 8, 28), iso(2026, 8, 1)),
    ("wh-select", "Component (connector, wire, tool) selection - 4 Sep", "done", "medium", ["Procurement"], "to", iso(2026, 9, 4), iso(2026, 8, 1)),
    ("wh-manual", "Manual connector & label - 11 Sep", "done", "medium", ["DRW"], "to", iso(2026, 9, 11), iso(2026, 8, 1)),
    ("wh-assembly", "Wiring harness assembly - 18 Sep", "done", "high", ["Manufacturing"], "to", iso(2026, 9, 18), iso(2026, 8, 1)),
    ("wh-drawing", "Drawing harness", "in-progress", "high", ["DRW"], "to", iso(2026, 12, 10), iso(2026, 11, 1)),
    ("wh-serial-bom", "Serial BOM for harness", "in-progress", "medium", ["DRW"], "to", iso(2026, 12, 10), iso(2026, 11, 1)),
    # --- Low voltage / PCB ---
    ("lv-shutdown-asm", "Shutdown PCB assembly (almost done - connector 23 pin)", "in-progress", "high", ["Elec"], "ck", iso(2026, 12, 4), iso(2026, 11, 1)),
    ("lv-centerhub-asm", "Center hub PCB assembly (almost done - diode & connector)", "in-progress", "high", ["Elec"], "ck", iso(2026, 12, 4), iso(2026, 11, 1)),
    ("lv-bspd-asm", "BSPD PCB assembly", "in-progress", "high", ["Elec"], "joe", iso(2026, 12, 4), iso(2026, 11, 1)),
    ("lv-vcu-asm", "VCU PCB assembly", "in-progress", "high", ["Elec"], "pokpong", iso(2026, 12, 4), iso(2026, 11, 1)),
    ("lv-tsal-ctrl", "TSAL control", "in-progress", "medium", ["Elec"], "ck", iso(2026, 12, 4), iso(2026, 11, 1)),
    ("lv-tsal-light", "TSAL light", "done", "medium", ["Elec"], "korn", iso(2026, 11, 13), iso(2026, 11, 1)),
    ("lv-centerhub-sch", "Center hub schematic design - 100%", "done", "high", ["Elec"], "ck", iso(2026, 10, 30), iso(2026, 9, 1)),
    ("lv-centerhub-pcb", "Center hub PCB design - 100%", "done", "high", ["Elec"], "ck", iso(2026, 10, 30), iso(2026, 9, 1)),
    ("lv-bspd-sch", "BSPD schematic design - 100%", "done", "high", ["Elec"], "joe", iso(2026, 10, 30), iso(2026, 9, 1)),
    ("lv-bspd-pcb", "BSPD PCB design - 100%", "done", "high", ["Elec"], "joe", iso(2026, 10, 30), iso(2026, 9, 1)),
    ("lv-routing-fix", "PCB routing bug - re-order placement", "done", "medium", ["Elec"], "ck", iso(2026, 10, 30), iso(2026, 9, 1)),
    ("lv-siampcb", "PCB order (SIAM PCB)", "in-progress", "medium", ["Procurement"], "angy", iso(2026, 12, 4), iso(2026, 11, 1)),
    ("lv-ecu-pcb", "ECU PCB", "in-progress", "high", ["Elec"], "pokpong", iso(2026, 12, 10), iso(2026, 11, 1)),
    ("lv-esf", "ESF shutdown circuit (schematic all done)", "in-progress", "high", ["Elec"], "ck", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("lv-impl-test", "PCB implementation test (deadline 20/11/2026)", "in-progress", "high", ["Test"], "ck", iso(2026, 11, 20), iso(2026, 11, 1)),
    ("lv-pcb-asm-deadline", "Complete PCB assembly (deadline 4/12/2026)", "in-progress", "high", ["Manufacturing"], "ck", iso(2026, 12, 4), iso(2026, 11, 1)),
    ("lv-pcb-unit-test", "PCB unit test (deadline 18/12/2026)", "todo", "high", ["Test"], "ck", iso(2026, 12, 18), iso(2026, 11, 1)),
    # --- Torque vectoring / ECU ---
    ("ecu-tv-draft", "Control torque vectoring draft 1", "in-progress", "high", ["Elec"], "pokpong", iso(2026, 11, 20), iso(2026, 11, 1)),
    ("ecu-adc", "ADC reading", "todo", "high", ["Elec"], "pokpong", iso(2026, 11, 27), iso(2026, 11, 1)),
    ("ecu-dac", "DAC read/write", "todo", "high", ["Elec"], "pokpong", iso(2026, 11, 27), iso(2026, 11, 1)),
    ("ecu-imu", "IMU testing", "todo", "high", ["Test"], "pokpong", iso(2026, 12, 4), iso(2026, 11, 1)),
    ("ecu-sd", "Micro SD card read/write", "todo", "medium", ["Elec"], "pokpong", iso(2026, 12, 4), iso(2026, 11, 1)),
    ("ecu-canbus", "CANBUS", "todo", "high", ["Elec"], "pokpong", iso(2026, 12, 4), iso(2026, 11, 1)),
    ("ecu-4g", "4G module", "todo", "medium", ["Elec"], "pokpong", iso(2026, 12, 10), iso(2026, 11, 1)),
    ("ecu-integration", "Integration", "todo", "high", ["Test"], "pokpong", iso(2026, 12, 10), iso(2026, 11, 1)),
    # --- Telemetry ---
    ("tel-esp32", "ESP32 CAN bus received (Gao)", "done", "medium", ["Telemetry"], "gao", iso(2026, 11, 13), iso(2026, 11, 1)),
    ("tel-lcd", "Waveshare LCD received (N'Pun, next week)", "done", "medium", ["Telemetry"], "npun", iso(2026, 11, 13), iso(2026, 11, 1)),
    ("tel-bms-ship", "Waiting for BMS shipping", "todo", "medium", ["Procurement"], "angy", iso(2026, 12, 4), iso(2026, 11, 13)),
    ("tel-can-log", "CAN data logging test", "todo", "high", ["Test"], "gao", iso(2026, 12, 4), iso(2026, 11, 13)),
    ("tel-bamo", "Read Bamo data and tune each parameter", "in-progress", "high", ["Test"], "toen", iso(2026, 12, 4), iso(2026, 11, 1)),
    ("tel-uav", "Mobile telemetry UAV (model finetuning WIP, deployment awaiting cost)", "in-progress", "medium", ["Telemetry"], "gao", iso(2026, 12, 10), iso(2026, 9, 1)),
    # --- Business / PR / Finance / GM ---
    ("gm-yellow", "Yellow paper - 80% (summit 20 Nov 2026)", "in-progress", "high", ["Business"], "ling", iso(2026, 11, 20), iso(2026, 9, 1)),
    ("gm-pitch", "Business pitch - red team vs blue team (before Christmas)", "in-progress", "high", ["Business"], "ling", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("gm-finance-review", "Ling's team financial review with P'Chamint", "in-progress", "medium", ["Finance"], "ling", iso(2026, 11, 27), iso(2026, 9, 1)),
    ("pr-livery", "Livery design (deadline 14 Jan 2026)", "in-progress", "high", ["PR"], "angy", iso(2026, 1, 14), iso(2026, 9, 1)),
    ("pr-logo", "Sponsor logo - 90%", "in-progress", "high", ["PR"], "angy", iso(2026, 1, 14), iso(2026, 9, 1)),
    ("pr-graphics", "Graphics design - 80% (deadline 25 Jan 2026)", "in-progress", "high", ["PR"], "angy", iso(2026, 1, 25), iso(2026, 9, 1)),
    ("pr-posts", "PR posts (Christmas done, New Year in process)", "in-progress", "medium", ["PR"], "angy", iso(2026, 1, 14), iso(2026, 9, 1)),
    ("pr-tshirt", "Team T-shirt design", "todo", "low", ["PR"], "angy", iso(2026, 1, 25), iso(2026, 9, 1)),
    ("pr-poster", "Sponsor appreciation poster", "todo", "low", ["PR"], "angy", iso(2026, 1, 25), iso(2026, 9, 1)),
    ("pr-launch", "Car launch poster & reveal video", "todo", "medium", ["PR"], "angy", iso(2026, 2, 1), iso(2026, 9, 1)),
    ("pr-raceday", "TSAE race day content", "todo", "medium", ["PR"], "angy", iso(2026, 2, 1), iso(2026, 9, 1)),
    ("fin-bpac", "B-PAC asset & cost control system", "in-progress", "medium", ["Finance"], "angy", iso(2026, 12, 10), iso(2026, 9, 1)),
    ("fin-tsae2027", "Financial & sponsor plan TSAE2027", "in-progress", "high", ["Finance"], "chamint", iso(2026, 12, 10), iso(2026, 9, 1)),
    # --- Issues from WEEK #47 notes ---
    ("is-46a", "ISSUE#46A Faulty sensors (no signal + noise) - buy 2 new sensors", "in-progress", "high", ["Issue"], "angy", iso(2026, 11, 15), iso(2026, 11, 16)),
    ("is-46b", "ISSUE#46B Bad sensor calibration - new CAD + recalibrate code", "in-progress", "high", ["Issue"], "angy", iso(2026, 11, 30), iso(2026, 11, 16)),
    ("is-46c", "ISSUE#46C Bad data-logger code (not portable, timer)", "in-progress", "medium", ["Issue"], "yuil", iso(2026, 11, 15), iso(2026, 11, 16)),
    ("is-46d", "ISSUE#46D Plastic tone ring - changed to steel", "done", "medium", ["Issue"], "angy", iso(2026, 11, 15), iso(2026, 11, 16)),
    ("is-46e", "ISSUE#46E Bad weather station (DHT11) - deferred to Thermo dept", "in-progress", "low", ["Issue"], "angy", iso(2026, 11, 30), iso(2026, 11, 16)),
    ("is-46f", "ISSUE#46F CAN bus bad code - practice session with Folk", "in-progress", "medium", ["Issue"], "angy", iso(2026, 11, 15), iso(2026, 11, 16)),
    ("is-46g", "ISSUE#46G Power cut triggers connection reset", "in-progress", "medium", ["Issue"], "yuil", iso(2026, 11, 30), iso(2026, 11, 16)),
    ("is-46i", "ISSUE#46I Pin configuration - new PCB with standard pins + SD config", "in-progress", "high", ["Issue"], "angy", iso(2026, 11, 30), iso(2026, 11, 16)),
    ("is-46k", "ISSUE#46K Data lost when ESP32 disconnects - SD card backup", "in-progress", "high", ["Issue"], "yuil", iso(2026, 11, 30), iso(2026, 11, 16)),
    ("is-47a", "ISSUE#47A Speed measurement from BP Mobile unreliable (GPS API)", "todo", "medium", ["Issue"], "yuil", iso(2026, 11, 30), iso(2026, 11, 16)),
    ("is-47b", "ISSUE#47B Broken front suspension - re-3D print mount", "in-progress", "high", ["Issue"], "angy", iso(2026, 11, 30), iso(2026, 11, 16)),
    ("is-47c", "ISSUE#47C Low-voltage power not restored after inspection", "in-progress", "medium", ["Issue"], "toen", iso(2026, 11, 30), iso(2026, 11, 16)),
    ("is-47d", "ISSUE#47D Wiring quality + installation concerns", "in-progress", "medium", ["Issue"], "toen", iso(2026, 11, 30), iso(2026, 11, 16)),
    ("is-47e", "ISSUE#47E Wheel hub & ground clearance (hub nearly broke)", "in-progress", "high", ["Issue"], "toen", iso(2026, 11, 30), iso(2026, 11, 16)),
    ("is-47f", "ISSUE#47F Telemetry not data-logging (power issue)", "in-progress", "medium", ["Issue"], "toen", iso(2026, 11, 30), iso(2026, 11, 16)),
    ("is-47g", "ISSUE#47G Pending telemetry tasks - order ESP32 + draw circuit diagram", "in-progress", "medium", ["Issue"], "toen", iso(2026, 11, 30), iso(2026, 11, 16)),
    ("is-47h", "ISSUE#47H Workload transfer to Pooh", "in-progress", "low", ["Issue"], "pooh", iso(2026, 11, 30), iso(2026, 11, 16)),
    ("is-47i", "ISSUE#47I Team capability expansion (Lily & Folk take over sensors)", "in-progress", "low", ["Issue"], "lily", iso(2026, 11, 30), iso(2026, 11, 16)),
    ("is-47j", "ISSUE#47J Next continuous test schedule (Dec week 2)", "todo", "medium", ["Issue"], "toen", iso(2026, 12, 10), iso(2026, 11, 16)),
]

tasks = [
    {
        "id": uid(k),
        "title": t,
        "status": s,
        "priority": p,
        "tags": tags,
        "assigneeId": by.get(a, ""),
        "due": due,
        "createdAt": created,
    }
    for (k, t, s, p, tags, a, due, created) in TASKS
]

# --------------------------------------------------------------------------
# BOM
# --------------------------------------------------------------------------
# (key, part_name, part_number, assembly, material, qty, unit_weight_g, unit_cost_thb, vendor, mfg)
BOM = [
    # Aero - front wing
    ("fw-main", "Front wing mainplane", "AERO-FW-001", "Front Wing", "Prepreg 600 gsm / XPS foam", 1, 0, 6104, "ordering", "waiting"),
    ("fw-flap", "Front wing flaps", "AERO-FW-002", "Front Wing", "Prepreg 300 gsm / XPS foam", 2, 0, 1687, "ordering", "waiting"),
    ("fw-end", "Front wing endplates", "AERO-FW-003", "Front Wing", "Birch plywood 3 mm", 2, 0, 990, "received", "cutting"),
    ("fw-mount", "Front wing mounts & brackets", "AERO-FW-004", "Front Wing", "Aluminium / steel sheet", 1, 0, 3039, "ordering", "waiting"),
    ("fw-hard", "Front wing hardpoints / inserts", "AERO-FW-005", "Front Wing", "Aluminium insert / epoxy", 1, 0, 954, "received", "machining"),
    # Aero - rear wing
    ("rw-main", "Rear wing mainplane", "AERO-RW-001", "Rear Wing", "Prepreg 600 gsm / XPS foam", 1, 0, 6475, "ordering", "waiting"),
    ("rw-flap", "Rear wing flaps", "AERO-RW-002", "Rear Wing", "Prepreg 300 gsm / XPS foam", 2, 0, 1535, "ordering", "waiting"),
    ("rw-end", "Rear wing endplates", "AERO-RW-003", "Rear Wing", "Prepreg 300 gsm / honeycomb", 2, 0, 542, "received", "cutting"),
    ("rw-mount", "Rear wing mounts & brackets", "AERO-RW-004", "Rear Wing", "Aluminium / steel sheet", 1, 0, 3039, "ordering", "waiting"),
    # Aero - body
    ("bd-nose", "Nosecone outer shell", "AERO-BD-001", "Body", "Prepreg 300 gsm", 1, 0, 3338, "ordering", "waiting"),
    ("bd-sidepod", "Sidepods", "AERO-BD-002", "Body", "Prepreg 300 gsm", 2, 0, 6464, "ordering", "waiting"),
    ("bd-sidewing", "Side wings / deflectors", "AERO-BD-003", "Body", "Prepreg 300 gsm", 2, 0, 2136, "ordering", "waiting"),
    ("bd-sideplate", "Side plate", "AERO-BD-004", "Body", "Birch plywood 3 mm", 2, 0, 848, "received", "cutting"),
    # Aero - undertray
    ("ut-floor", "Undertray floor", "AERO-UT-001", "Undertray", "Fiberglass 200 gsm / coremat", 1, 0, 2746, "ordering", "waiting"),
    ("ut-diffuser", "Diffuser tunnel & fins", "AERO-UT-002", "Undertray", "Carbon prepreg / birch plywood", 1, 0, 4273, "ordering", "waiting"),
    ("ut-bracket", "Undertray brackets", "AERO-UT-003", "Undertray", "Aluminium 6061-T6 / PETG", 1, 0, 1271, "ordering", "waiting"),
    # Impact attenuator
    ("ia-pmi", "IA PMI foam + CNC machining (per piece)", "IA-002", "Impact Structures", "TX-series PMI foam", 3, 0, 12048, "ordering", "waiting"),
    ("ia-ship", "IA CNC shipping (3 pieces)", "IA-003", "Impact Structures", "Freight", 1, 0, 3667, "ordering", "waiting"),
    # Suspension - DCP
    ("dcp-rollrod", "Roll rod end 1,2 & roll shock mount", "SUS-DCP-001", "Suspension", "Steel", 4, 0, 527, "received", "done"),
    ("dcp-bearing", "M6 linear bearing C-LMU6", "SUS-DCP-002", "Suspension", "Steel", 8, 0, 61, "received", "done"),
    ("dcp-shaft", "6 mm linear shaft PSSFAL6-315-B20-S20", "SUS-DCP-003", "Suspension", "Steel", 8, 0, 0, "received", "done"),
    # Raw material
    ("rm-stkm-12", "STKM 13B pipe 25.4 OD x 1.2 mm (6000 mm)", "RAW-STKM-12", "Raw Material", "STKM 13B", 4, 0, 0, "received", "done"),
    ("rm-stkm-16", "STKM 13B pipe 25.4 OD x 1.6 mm (6000 mm)", "RAW-STKM-16", "Raw Material", "STKM 13B", 4, 0, 0, "received", "done"),
    ("rm-stkm-24", "STKM 13B pipe 25.4 OD x 2.4 mm (6000 mm)", "RAW-STKM-24", "Raw Material", "STKM 13B", 4, 0, 0, "received", "done"),
    ("rm-od16", "Tube OD 16 mm / ID 12 mm x 14.5 m", "RAW-OD16", "Raw Material", "Steel", 1, 0, 0, "received", "done"),
    # Battery
    ("bat-30ah", "Accumulator pack 30 Ah (84 cells, incl 1 spare module)", "PWT-ACC-001", "Accumulator", "Li-ion cells", 1, 73000, 63825, "ordering", "waiting"),
    ("bat-bmu", "BMU (Daly BMS slave board)", "PWT-BMS-001", "Accumulator", "Electronics", 7, 62, 0, "received", "machining"),
    ("bat-board-fuse", "Board fuse", "PWT-BMS-002", "Accumulator", "Electronics", 1, 168, 0, "received", "machining"),
    # Powertrain
    ("pt-sprocket-mount", "Sprocket mounting (topology, 13 mm)", "PWT-DT-001", "Drivetrain", "Aluminium", 1, 718, 0, "received", "machining"),
    ("pt-sprocket-carrier", "Sprocket carrier (topology)", "PWT-DT-002", "Drivetrain", "Aluminium", 1, 174, 0, "received", "machining"),
    ("pt-motor-mount", "Motor mount (topology, 13 mm)", "PWT-DT-003", "Drivetrain", "Aluminium", 1, 844, 0, "received", "machining"),
    # Steering
    ("str-assy", "Steering assembly", "STR-001", "Steering", "Steel / aluminium", 1, 0, 13, "received", "done"),
    ("str-inertia-sw", "Inertia switch", "STR-002", "Steering", "Electronics", 3, 0, 131, "ordering", "waiting"),
    ("str-pot", "Steering potentiometer", "STR-003", "Steering", "Electronics", 2, 0, 93, "ordering", "waiting"),
    ("str-emg-sw", "Emergency switch + BOTS", "STR-004", "Steering", "Electronics", 2, 0, 155, "ordering", "waiting"),
    # Chains / drivetrain consumables
    ("pt-chain-ert3", "D.I.D 520 ERT3 G&G 120 ZB chain", "PWT-CH-001", "Drivetrain", "Steel", 2, 0, 0, "received", "done"),
    ("pt-chain-erv7", "D.I.D 520 ERV7 G&G 120 ZB (X-Ring) chain", "PWT-CH-002", "Drivetrain", "Steel", 1, 0, 0, "received", "done"),
    ("pt-wheel-lenso", "Lenso wheel", "PWT-WH-001", "Drivetrain", "Aluminium", 1, 0, 0, "received", "done"),
    ("pt-gear-planet", "Planetary gear (MTM custom ratio)", "PWT-GR-001", "Drivetrain", "Steel", 2, 0, 0, "ordering", "waiting"),
    # Sensors
    ("sen-rpm", "RPM sensor (replacement)", "SYS-SN-001", "Telemetry", "Electronics", 2, 0, 0, "ordering", "waiting"),
    ("sen-stroke", "Stroke sensor (replacement)", "SYS-SN-002", "Telemetry", "Electronics", 2, 0, 0, "ordering", "waiting"),
    ("sen-dht", "Weather station (replace DHT11)", "SYS-SN-003", "Telemetry", "Electronics", 1, 0, 0, "ordering", "waiting"),
]

bom = [
    {
        "id": uid(k),
        "partName": pn,
        "partNumber": num,
        "assembly": asm,
        "material": mat,
        "quantity": qty,
        "unitWeight": wt,
        "unitCost": cost,
        "vendorStatus": v,
        "mfgStatus": m,
    }
    for (k, pn, num, asm, mat, qty, wt, cost, v, m) in BOM
]

# --------------------------------------------------------------------------
# Milestones
# --------------------------------------------------------------------------
# (key, name, due, status)
MILESTONES = [
    ("ms-ses", "SES + Impact report (Quest 1)", iso(2026, 9, 7), "completed"),
    ("ms-design", "Design report + Cost (Quest 2)", iso(2026, 9, 18), "completed"),
    ("ms-bizplan", "Business plan (Quest 3)", iso(2026, 11, 3), "completed"),
    ("ms-ansys", "Ansys simulation (Quest 4)", iso(2026, 11, 27), "in-progress"),
    ("ms-race", "Race (Quest 5) — TSAE Auto Challenge 2026", iso(2026, 2, 5), "pending"),
    ("ms-cost-drw", "Cost + drawing deadline", iso(2026, 9, 30), "completed"),
    ("ms-bom", "BOM deadline", iso(2026, 10, 2), "completed"),
    ("ms-yellow", "Yellow paper summit", iso(2026, 11, 20), "at-risk"),
    ("ms-pcb-asm", "Complete PCB assembly", iso(2026, 12, 4), "pending"),
    ("ms-pcb-test", "PCB unit test", iso(2026, 12, 18), "pending"),
    ("ms-brd", "BRD (powertrain)", iso(2026, 11, 27), "pending"),
    ("ms-livery", "Livery design deadline", iso(2026, 1, 14), "pending"),
    ("ms-graphics", "Graphics design deadline", iso(2026, 1, 25), "pending"),
    ("ms-final-design", "Final design (TSAE design presentation)", iso(2026, 1, 25), "pending"),
    ("ms-bms-full", "7/7 BMS integration complete", iso(2026, 9, 6), "delayed"),
]

STATUS_MAP = {"completed": "completed", "in-progress": "at-risk", "pending": "pending", "at-risk": "at-risk", "delayed": "delayed"}

milestones = [
    {"id": uid(k), "name": n, "dueDate": due, "status": STATUS_MAP.get(s, "pending")}
    for (k, n, due, s) in MILESTONES
]

# --------------------------------------------------------------------------
# Files
# --------------------------------------------------------------------------
FILES = [
    ("f-frame-v3", "Frame_Assembly_Ver3_drawing.dwg", "CAD", "DRW", 4_200_000),
    ("f-frame-v4", "Frame_Assembly_Ver4_drawing.dwg", "CAD", "DRW", 4_800_000),
    ("f-ia-step", "IA_varying_thickness_design.step", "CAD", "CAD", 1_200_000),
    ("f-aero-fw", "Front_Wing_layup_schedule.pdf", "Composite", "DRW", 900_000),
    ("f-aero-rw", "Rear_Wing_layup_schedule.pdf", "Composite", "DRW", 900_000),
    ("f-aero-nose", "Nosecone_Sidepod_tooling.pdf", "Composite", "DRW", 1_100_000),
    ("f-dcp-fea", "DCP_FEA_report.pdf", "FEA", "FEA Report", 2_800_000),
    ("f-ia-test", "IA_compression_test_UTM.pdf", "Test", "Test Report", 700_000),
    ("f-esf", "ESF_Shutdown_Circuit.pdf", "Elec", "DRW", 540_000),
    ("f-harness", "Wiring_Harness_diagram.pdf", "Elec", "DRW", 1_500_000),
    ("f-bms-can", "BMS_CAN_integration_report.pdf", "Elec", "Report", 800_000),
    ("f-cost-aero", "Aero_cost_breakdown.xlsx", "BOM", "BOM", 410_000),
]

files = [
    {
        "id": uid(k),
        "name": n,
        "category": c,
        "type": t,
        "size": s,
        "updatedAt": iso(2026, 11, 13, 12),
    }
    for (k, n, c, t, s) in FILES
]

# --------------------------------------------------------------------------
# Project
# --------------------------------------------------------------------------
project = {
    "name": "BP18",
    "season": "TSAE 2026",
    "competitionDate": iso(2026, 2, 5, 10),
    "targetWeight": 29.5,
    "currentWeight": 29.537,
    "subsystemWeights": [
        {"subsystem": "Frame", "budget": 29.5, "actual": 29.537},
        {"subsystem": "Powertrain", "budget": 54.5, "actual": 0},
        {"subsystem": "Electrical", "budget": 13, "actual": 0},
        {"subsystem": "Accumulator", "budget": 73, "actual": 0},
        {"subsystem": "Suspension", "budget": 0, "actual": 0},
        {"subsystem": "Aero", "budget": 0, "actual": 0},
    ],
    "weightHistory": [
        {"date": iso(2026, 8, 1), "weight": 32.0, "note": "BP18 Ver.1 frame"},
        {"date": iso(2026, 9, 15), "weight": 30.95, "note": "BP18 Ver.2 frame"},
        {"date": iso(2026, 10, 20), "weight": 33.02, "note": "BP16B (no DCP) baseline"},
        {"date": iso(2026, 11, 13), "weight": 29.537, "note": "BP18 Ver.4 - decrease 3.483 kg"},
    ],
    "materialMix": [
        {"material": "Accumulator (cells)", "share": 73},
        {"material": "Steel 4130 / STKM (frame)", "share": 29.5},
        {"material": "Aluminium 6061 / 7075", "share": 12},
        {"material": "Carbon fibre / prepreg", "share": 8},
        {"material": "Foam core (XPS / PMI)", "share": 2},
    ],
}

activity = [
    {
        "id": uid("act-import"),
        "message": "Imported BP18 progress data from Progress_13Nov2026.pdf",
        "type": "system",
        "actorId": by["angy"],
        "timestamp": iso(2026, 11, 13, 23),
    },
    {
        "id": uid("act-frame-ver4"),
        "message": "Frame modified to BP18 Ver.4 - 29.537 kg (down 3.483 kg from BP16B)",
        "type": "approve",
        "actorId": by["prin"],
        "timestamp": iso(2026, 11, 13, 12),
    },
    {
        "id": uid("act-ia-fail"),
        "message": "Impact attenuator failed 600 J requirement - redesign in progress",
        "type": "error",
        "actorId": by["prin"],
        "timestamp": iso(2026, 11, 13, 12),
    },
]

data = {
    "project": project,
    "members": members,
    "tasks": tasks,
    "bom": bom,
    "milestones": milestones,
    "files": files,
    "activity": activity,
}

out = Path(__file__).resolve().parent.parent / "data" / "bp18-progress-2026.json"
out.parent.mkdir(parents=True, exist_ok=True)

# Guard: duplicate keys would collide on uuid5 and break the Postgres upsert.
import collections

_dupes = [k for k, c in collections.Counter(t[0] for t in TASKS).items() if c > 1]
if _dupes:
    raise SystemExit(f"duplicate task keys: {_dupes}")
_dupes_m = [k for k, c in collections.Counter(m[0] for m in MEMBERS).items() if c > 1]
if _dupes_m:
    raise SystemExit(f"duplicate member keys: {_dupes_m}")

out.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

print(f"members  {len(members)}")
print(f"tasks    {len(tasks)}  (done {sum(1 for t in tasks if t['status']=='done')}, in-progress {sum(1 for t in tasks if t['status']=='in-progress')}, todo {sum(1 for t in tasks if t['status']=='todo')})")
print(f"bom      {len(bom)}")
print(f"milestones {len(milestones)}")
print(f"files    {len(files)}")
print(f"wrote {out}")
