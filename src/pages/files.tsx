import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import type { FileItem } from "../lib/types";
import { fmtDate, fmtSize, titleCase } from "../lib/format";
import { Badge, Button, Card, CardHeader, EmptyState, Field, IconButton, Input, Modal, Select } from "../components/ui";
import { IconDownload, IconFile, IconPlus, IconSearch, IconTrash } from "../components/icons";

const CATEGORIES = ["CAD", "FEA", "BOM", "Manufacturing", "Composite", "Docs"];

export function FilesPage() {
  const { state, deleteFile } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState<FileItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<FileItem | null>(null);

  const categories = useMemo(() => Array.from(new Set(state.files.map((f) => f.category))).sort(), [state.files]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.files.filter((f) => {
      if (category !== "all" && f.category !== category) return false;
      if (q && !f.name.toLowerCase().includes(q) && !f.type.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [state.files, query, category]);

  const totalSize = rows.reduce((s, f) => s + f.size, 0);

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <Card className="kpi">
          <div className="kpi-label">Files indexed</div>
          <div className="kpi-value">{rows.length}</div>
          <div className="kpi-foot"><span className="dim">{categories.length} categories</span></div>
        </Card>
        <Card className="kpi">
          <div className="kpi-label">Indexed size</div>
          <div className="kpi-value">{fmtSize(totalSize)}</div>
          <div className="kpi-foot"><span className="dim">metadata only — no binary stored</span></div>
        </Card>
        <Card className="kpi">
          <div className="kpi-label">CAD models</div>
          <div className="kpi-value t-accent">{state.files.filter((f) => f.type === "CAD").length}</div>
          <div className="kpi-foot"><span className="dim">STEP and native files</span></div>
        </Card>
        <Card className="kpi">
          <div className="kpi-label">Reports</div>
          <div className="kpi-value t-accent">{state.files.filter((f) => f.type.includes("FEA")).length}</div>
          <div className="kpi-foot"><span className="dim">FEA and analysis output</span></div>
        </Card>
      </div>

      <Card className="card-flush">
        <div style={{ padding: 20 }}>
          <CardHeader
            title="File index"
            subtitle="Drawing, CAD and report register — entries point at the shared drive"
            icon={<IconFile size={18} />}
            actions={
              <Button variant="primary" onClick={() => setEditing("new")}>
                <IconPlus size={16} />
                Index file
              </Button>
            }
          />
          <div className="filter-bar">
            <div className="search-box">
              <IconSearch size={16} />
              <input
                placeholder="Search filename or type..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search files"
              />
            </div>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category" style={{ width: 200, minHeight: 40 }}>
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div style={{ padding: "0 20px 20px" }}>
          {rows.length === 0 ? (
            <EmptyState title="No files match" hint="Adjust filters or index a new file." />
          ) : (
            rows.map((f) => (
              <div className="file-row" key={f.id}>
                <div className="file-icon" aria-hidden="true">
                  <IconFile size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="file-name">{f.name}</div>
                  <div className="file-meta">
                    {f.type} · {fmtSize(f.size)} · updated {fmtDate(f.updatedAt)}
                  </div>
                </div>
                <Badge tone={f.type === "CAD" ? "info" : f.type.includes("FEA") ? "ok" : "dim"}>{f.category.toUpperCase()}</Badge>
                <div className="row-actions">
                  <IconButton label={"Download " + f.name} onClick={() => deleteFile(f.id)}>
                    <IconDownload size={16} />
                  </IconButton>
                  <IconButton label={"Remove " + f.name} onClick={() => setDeleting(f)}>
                    <IconTrash size={16} />
                  </IconButton>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <FileModal file={editing} onClose={() => setEditing(null)} />
      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Remove file entry"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleting) deleteFile(deleting.id);
                setDeleting(null);
              }}
            >
              <IconTrash size={16} /> Remove
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 16 }}>
          Remove <strong>{deleting?.name}</strong> from the index? The file itself on the shared drive is untouched.
        </p>
      </Modal>
    </>
  );
}

function FileModal({ file, onClose }: { file: FileItem | "new" | null; onClose: () => void }) {
  const { addFile } = useStore();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("CAD");
  const [type, setType] = useState("CAD");
  const [size, setSize] = useState("");

  if (!file) return null;

  function save() {
    if (!name.trim()) return;
    addFile({
      name: name.trim(),
      category,
      type,
      size: Number(size) || 0,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Index file"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!name.trim()}>
            <IconPlus size={16} /> Add entry
          </Button>
        </>
      }
    >
      <Field label="Filename" hint="Include the extension, e.g. Main_Hoop_v3.step">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Main_Hoop_v3.step" autoFocus />
      </Field>
      <div className="form-grid">
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {titleCase(c)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option>CAD</option>
            <option>DRW</option>
            <option>FEA Report</option>
            <option>BOM</option>
            <option>Document</option>
          </Select>
        </Field>
      </div>
      <Field label="Size (bytes)" hint="Optional — used for the indexed-size total">
        <Input type="number" min={0} value={size} onChange={(e) => setSize(e.target.value)} placeholder="4200000" />
      </Field>
    </Modal>
  );
}
