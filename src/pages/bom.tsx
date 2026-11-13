import { useEffect, useMemo, useState } from "react";
import { useStore } from "../lib/store";
import type { BomPart, MfgStatus, VendorStatus } from "../lib/types";
import { fmtMoney, fmtNum, STATUS_LABEL, STATUS_TONE, titleCase } from "../lib/format";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  Select,
} from "../components/ui";
import { IconDownload, IconEdit, IconLayers, IconPlus, IconSearch, IconTrash } from "../components/icons";

const VENDOR_ORDER: VendorStatus[] = ["ordering", "shipping", "received", "qc_passed", "qc_failed"];
const MFG_ORDER: MfgStatus[] = ["waiting", "cutting", "machining", "welding", "done"];

export function BomPage() {
  const { state, deleteBom } = useStore();
  const [query, setQuery] = useState("");
  const [assembly, setAssembly] = useState("all");
  const [material, setMaterial] = useState("all");
  const [vendor, setVendor] = useState<"all" | VendorStatus>("all");
  const [mfg, setMfg] = useState<"all" | MfgStatus>("all");
  const [sort, setSort] = useState<"assembly" | "partName" | "totalCost" | "totalWeight" | "partNumber">("assembly");
  const [editing, setEditing] = useState<BomPart | "new" | null>(null);
  const [deleting, setDeleting] = useState<BomPart | null>(null);

  const assemblies = useMemo(() => Array.from(new Set(state.bom.map((b) => b.assembly))).sort(), [state.bom]);
  const materials = useMemo(() => Array.from(new Set(state.bom.map((b) => b.material))).sort(), [state.bom]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = state.bom.filter((b) => {
      if (assembly !== "all" && b.assembly !== assembly) return false;
      if (material !== "all" && b.material !== material) return false;
      if (vendor !== "all" && b.vendorStatus !== vendor) return false;
      if (mfg !== "all" && b.mfgStatus !== mfg) return false;
      if (
        q &&
        !b.partName.toLowerCase().includes(q) &&
        !b.partNumber.toLowerCase().includes(q) &&
        !b.material.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === "partName") return a.partName.localeCompare(b.partName);
      if (sort === "partNumber") return a.partNumber.localeCompare(b.partNumber);
      if (sort === "totalCost") return b.unitCost * b.quantity - a.unitCost * a.quantity;
      return (b.unitWeight * b.quantity) / 1000 - (a.unitWeight * a.quantity) / 1000;
    });
  }, [state.bom, query, assembly, material, vendor, mfg, sort]);

  const totals = useMemo(() => {
    const cost = rows.reduce((s, b) => s + b.unitCost * b.quantity, 0);
    const weight = rows.reduce((s, b) => s + (b.unitWeight * b.quantity) / 1000, 0);
    return { cost, weight, parts: rows.length, qcFail: rows.filter((b) => b.vendorStatus === "qc_failed").length };
  }, [rows]);

  const rollup = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of rows) map.set(b.assembly, (map.get(b.assembly) ?? 0) + b.unitCost * b.quantity);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  function exportCsv() {
    const header = "part_number,part_name,assembly,material,quantity,unit_weight_g,total_weight_kg,unit_cost_thb,total_cost_thb,vendor_status,mfg_status";
    const body = rows
      .map((b) =>
        [
          b.partNumber,
          b.partName,
          b.assembly,
          b.material,
          b.quantity,
          b.unitWeight,
          ((b.unitWeight * b.quantity) / 1000).toFixed(2),
          b.unitCost,
          b.unitCost * b.quantity,
          b.vendorStatus,
          b.mfgStatus,
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bp18-bom.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <Summary label="BOM cost" value={"฿" + fmtNum(totals.cost)} sub={totals.parts + " line items"} />
        <Summary label="BOM weight" value={totals.weight.toFixed(1) + " kg"} sub="sum of line weights" />
        <Summary label="QC failures" value={String(totals.qcFail)} sub="parts blocked at receipt" tone={totals.qcFail > 0 ? "danger" : "ok"} />
        <Summary
          label="In process"
          value={String(rows.filter((b) => ["cutting", "machining", "welding"].includes(b.mfgStatus)).length)}
          sub="shop floor active"
          tone="warn"
        />
      </div>

      <Card className="card-flush">
        <div style={{ padding: 20 }}>
          <CardHeader
            title="Bill of materials"
            subtitle={totals.parts + " parts across " + assemblies.length + " assemblies"}
            icon={<IconLayers size={18} />}
            actions={
              <>
                <Button onClick={exportCsv}>
                  <IconDownload size={16} />
                  CSV
                </Button>
                <Button variant="primary" onClick={() => setEditing("new")}>
                  <IconPlus size={16} />
                  Add part
                </Button>
              </>
            }
          />
          <div className="filter-bar">
            <div className="search-box">
              <IconSearch size={16} />
              <input
                placeholder="Search part, number or material..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search BOM"
              />
            </div>
            <Select value={assembly} onChange={(e) => setAssembly(e.target.value)} aria-label="Filter by assembly" style={{ width: 180, minHeight: 40 }}>
              <option value="all">All assemblies</option>
              {assemblies.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
            <Select value={material} onChange={(e) => setMaterial(e.target.value)} aria-label="Filter by material" style={{ width: 180, minHeight: 40 }}>
              <option value="all">All materials</option>
              {materials.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
            <Select value={sort} onChange={(e) => setSort(e.target.value as never)} aria-label="Sort BOM" style={{ width: 180, minHeight: 40 }}>
              <option value="assembly">Sort: assembly</option>
              <option value="partName">Sort: name</option>
              <option value="partNumber">Sort: part no</option>
              <option value="totalCost">Sort: cost</option>
              <option value="totalWeight">Sort: weight</option>
            </Select>
            <div className="grow" />
            {VENDOR_ORDER.map((v) => (
              <button
                key={v}
                className={"filter-chip" + (vendor === v ? " filter-chip-active" : "")}
                onClick={() => setVendor(vendor === v ? "all" : v)}
                aria-pressed={vendor === v}
                style={vendor !== v ? { color: "var(--" + STATUS_TONE[v] + ")" } : undefined}
              >
                {STATUS_LABEL[v]}
              </button>
            ))}
            <span style={{ width: 1, height: 24, background: "var(--border)" }} aria-hidden="true" />
            {MFG_ORDER.map((m) => (
              <button
                key={m}
                className={"filter-chip" + (mfg === m ? " filter-chip-active" : "")}
                onClick={() => setMfg(mfg === m ? "all" : m)}
                aria-pressed={mfg === m}
                style={mfg !== m ? { color: "var(--" + STATUS_TONE[m] + ")" } : undefined}
              >
                {STATUS_LABEL[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrap" style={{ padding: "0 20px 20px", margin: 0 }}>
          {rows.length === 0 ? (
            <EmptyState
              title="No parts match"
              hint="Adjust filters or add a part to the bill of materials."
              action={
                <Button variant="primary" onClick={() => setEditing("new")}>
                  <IconPlus size={16} /> Add part
                </Button>
              }
            />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Part</th>
                  <th>Part no</th>
                  <th>Assembly</th>
                  <th>Material</th>
                  <th style={{ textAlign: "right" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Unit kg</th>
                  <th style={{ textAlign: "right" }}>Total kg</th>
                  <th style={{ textAlign: "right" }}>Unit ฿</th>
                  <th style={{ textAlign: "right" }}>Total ฿</th>
                  <th>Vendor</th>
                  <th>Mfg</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="table-strong">{b.partName}</div>
                    </td>
                    <td className="mono" style={{ fontSize: 13 }}>
                      {b.partNumber}
                    </td>
                    <td style={{ fontSize: 13 }}>{b.assembly}</td>
                    <td style={{ fontSize: 13 }}>{b.material}</td>
                    <td className="table-num">{b.quantity}</td>
                    <td className="table-num">{fmtNum(b.unitWeight / 1000, 2)}</td>
                    <td className="table-num">{((b.unitWeight * b.quantity) / 1000).toFixed(2)}</td>
                    <td className="table-num">{fmtNum(b.unitCost)}</td>
                    <td className="table-num table-strong">{fmtNum(b.unitCost * b.quantity)}</td>
                    <td>
                      <Badge tone={STATUS_TONE[b.vendorStatus] as never}>{STATUS_LABEL[b.vendorStatus]}</Badge>
                    </td>
                    <td>
                      <Badge tone={STATUS_TONE[b.mfgStatus] as never}>{STATUS_LABEL[b.mfgStatus]}</Badge>
                    </td>
                    <td>
                      <div className="row-actions">
                        <IconButton label={"Edit " + b.partName} onClick={() => setEditing(b)}>
                          <IconEdit size={16} />
                        </IconButton>
                        <IconButton label={"Delete " + b.partName} onClick={() => setDeleting(b)}>
                          <IconTrash size={16} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "var(--surface-2)" }}>
                  <td colSpan={4} style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", color: "var(--text-3)" }}>
                    TOTAL — {totals.parts} PARTS
                  </td>
                  <td className="table-num">{[...rows].reduce((s, b) => s + b.quantity, 0)}</td>
                  <td></td>
                  <td className="table-num table-strong">{totals.weight.toFixed(2)}</td>
                  <td></td>
                  <td className="table-num table-strong">{fmtNum(totals.cost)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Cost rollup by assembly" subtitle="Where the budget actually sits" icon={<IconLayers size={18} />} />
        <div className="hbars">
          {rollup.map(([name, value]) => (
            <div className="hbar" key={name}>
              <div className="hbar-top">
                <span className="hbar-label">{name}</span>
                <span className="hbar-value mono">
                  ฿{fmtNum(value)} · {totals.cost ? Math.round((value / totals.cost) * 100) : 0}%
                </span>
              </div>
              <div className="hbar-track">
                <div
                  className="hbar-fill hbar-accent"
                  style={{ width: (totals.cost ? (value / totals.cost) * 100 : 0) + "%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <BomModal part={editing} assemblies={assemblies} materials={materials} onClose={() => setEditing(null)} />
      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete part"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleting) deleteBom(deleting.id);
                setDeleting(null);
              }}
            >
              <IconTrash size={16} /> Delete
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 16 }}>
          Remove <strong>{deleting?.partName}</strong> ({deleting?.partNumber}) from the bill of materials?
        </p>
      </Modal>
    </>
  );
}

function Summary({ label, value, sub, tone = "accent" }: { label: string; value: string; sub: string; tone?: "accent" | "ok" | "warn" | "danger" }) {
  return (
    <Card className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color: tone === "accent" ? "var(--text)" : "var(--" + tone + ")" }}>
        {value}
      </div>
      <div className="kpi-foot">
        <span className="dim">{sub}</span>
      </div>
    </Card>
  );
}

function BomModal({
  part,
  assemblies,
  materials,
  onClose,
}: {
  part: BomPart | "new" | null;
  assemblies: string[];
  materials: string[];
  onClose: () => void;
}) {
  const { addBom, updateBom } = useStore();
  const isNew = part === "new";
  const current = isNew || part === null ? null : part;

  const [partName, setPartName] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [asm, setAsm] = useState("");
  const [mat, setMat] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitWeight, setUnitWeight] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [vendorStatus, setVendorStatus] = useState<VendorStatus>("ordering");
  const [mfgStatus, setMfgStatus] = useState<MfgStatus>("waiting");

  useEffect(() => {
    if (!part) return;
    setPartName(current?.partName ?? "");
    setPartNumber(current?.partNumber ?? "");
    setAsm(current?.assembly ?? assemblies[0] ?? "");
    setMat(current?.material ?? materials[0] ?? "");
    setQuantity(String(current?.quantity ?? 1));
    setUnitWeight(current ? String(current.unitWeight) : "");
    setUnitCost(current ? String(current.unitCost) : "");
    setVendorStatus(current?.vendorStatus ?? "ordering");
    setMfgStatus(current?.mfgStatus ?? "waiting");
  }, [part, current, assemblies, materials]);

  if (!part) return null;

  const qty = Number(quantity) || 0;
  const uw = Number(unitWeight) || 0;
  const uc = Number(unitCost) || 0;

  function save() {
    if (!partName.trim() || !partNumber.trim()) return;
    const payload = {
      partName: partName.trim(),
      partNumber: partNumber.trim().toUpperCase(),
      assembly: asm,
      material: mat,
      quantity: qty,
      unitWeight: uw,
      unitCost: uc,
      vendorStatus,
      mfgStatus,
    };
    if (isNew) addBom(payload);
    else if (current) updateBom(current.id, payload);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Add part" : "Edit part"}
      width={640}
      footer={
        <>
          <div className="grow mono" style={{ fontSize: 13, color: "var(--text-3)", alignSelf: "center" }}>
            LINE TOTAL ฿{fmtNum(uc * qty)} · {((uw * qty) / 1000).toFixed(2)} kg
          </div>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!partName.trim() || !partNumber.trim()}>
            <IconPlus size={16} />
            {isNew ? "Add to BOM" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Part name" className="field-wide">
          <Input value={partName} onChange={(e) => setPartName(e.target.value)} placeholder="e.g. Main Hoop" autoFocus />
        </Field>
        <Field label="Part number">
          <Input value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="BH-001" />
        </Field>
        <Field label="Assembly">
          <Input value={asm} onChange={(e) => setAsm(e.target.value)} placeholder="Chassis" list="assembly-list" />
        </Field>
        <Field label="Material">
          <Input value={mat} onChange={(e) => setMat(e.target.value)} placeholder="Steel 4130" list="material-list" />
        </Field>
        <Field label="Quantity">
          <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </Field>
        <Field label="Unit weight (g)">
          <Input type="number" min={0} value={unitWeight} onChange={(e) => setUnitWeight(e.target.value)} />
        </Field>
        <Field label="Unit cost (฿)">
          <Input type="number" min={0} value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
        </Field>
        <Field label="Vendor status">
          <Select value={vendorStatus} onChange={(e) => setVendorStatus(e.target.value as VendorStatus)}>
            {VENDOR_ORDER.map((v) => (
              <option key={v} value={v}>
                {titleCase(v.replace(/_/g, " "))}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Manufacturing status">
          <Select value={mfgStatus} onChange={(e) => setMfgStatus(e.target.value as MfgStatus)}>
            {MFG_ORDER.map((m) => (
              <option key={m} value={m}>
                {titleCase(m)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <datalist id="assembly-list">
        {assemblies.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
      <datalist id="material-list">
        {materials.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
    </Modal>
  );
}
