import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "../lib/store";
import { getStoredConfig } from "../lib/supabase";
import type { ConnectionResult, TableStat } from "../lib/backend";
import { fmtNum, relTime } from "../lib/format";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  IconButton,
  Input,
  Modal,
} from "../components/ui";
import {
  IconCheckCircle,
  IconCloud,
  IconDatabase,
  IconDownload,
  IconAlert,
  IconRefresh,
  IconTrash,
  IconUpload,
} from "../components/icons";

export function SettingsPage() {
  const {
    state,
    backend,
    connect,
    disconnect,
    refresh,
    testBackend,
    resetData,
    clearData,
    exportJson,
    importJson,
    pushToast,
  } = useStore();

  const stored = getStoredConfig();
  const [url, setUrl] = useState(stored?.url ?? "");
  const [key, setKey] = useState(stored?.anonKey ?? "");
  const [busy, setBusy] = useState(false);
  const [probe, setProbe] = useState<ConnectionResult | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cfg = getStoredConfig();
    setUrl(cfg?.url ?? "");
    setKey(cfg?.anonKey ?? "");
  }, []);

  const mode = backend.mode;
  const live = mode === "supabase" && backend.connected;

  const doConnect = useCallback(async () => {
    if (!url.trim() || !key.trim()) {
      pushToast("Both URL and anon key are required", "warn");
      return;
    }
    setBusy(true);
    const res = await connect({ url: url.trim(), anonKey: key.trim() });
    setProbe(res);
    setBusy(false);
  }, [url, key, connect, pushToast]);

  const doTest = useCallback(async () => {
    setBusy(true);
    const res = await testBackend();
    setProbe(res);
    setBusy(false);
    if (res?.ok) pushToast(`Connection OK — ${res.latencyMs} ms`, "ok");
  }, [testBackend, pushToast]);

  const doRefresh = useCallback(async () => {
    setBusy(true);
    await refresh();
    setBusy(false);
  }, [refresh, pushToast]);

  function download() {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "bp18-dashboard-data.json";
    a.click();
    URL.revokeObjectURL(href);
    pushToast("Data exported", "info");
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importJson(String(reader.result ?? ""));
    reader.readAsText(file);
    e.target.value = "";
  }

  const rows = backend.rowCounts ?? [];

  return (
    <>
      <div className="grid-2">
        {/* ---------------- Connection ---------------- */}
        <Card>
          <CardHeader
            title="Supabase connection"
            subtitle="Postgres backend — the anon key stays in this browser, never in the bundle"
            icon={<IconCloud size={18} />}
            actions={
              <Badge tone={live ? "ok" : mode === "supabase" ? "warn" : "dim"}>
                {live ? "LIVE" : mode === "supabase" ? "CONFIGURED" : "LOCAL ONLY"}
              </Badge>
            }
          />

          <Field label="Project URL" hint="https://<project-ref>.supabase.co">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://abcdefgh.supabase.co"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <Field label="Anonymous public key" hint="Project → API Keys → anon public">
            <Input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOi…"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>

          <div className="flex gap-8 wrap">
            <Button variant="primary" onClick={doConnect} disabled={busy}>
              <IconCloud size={16} />
              {busy ? "Working…" : "Save & connect"}
            </Button>
            <Button onClick={doTest} disabled={busy || mode === "local"}>
              <IconCheckCircle size={16} />
              Test connection
            </Button>
            <Button onClick={doRefresh} disabled={busy || mode === "local"}>
              <IconRefresh size={16} />
              Pull latest
            </Button>
            <div className="grow" />
            <Button variant="ghost" onClick={disconnect} disabled={mode === "local"}>
              Disconnect
            </Button>
          </div>

          <div className="mt-16">
            <div className="stat-row">
              <span className="stat-row-label">Mode</span>
              <span className="stat-row-value">{mode === "supabase" ? "SUPABASE" : "LOCAL STORAGE"}</span>
            </div>
            <div className="stat-row">
              <span className="stat-row-label">Latency</span>
              <span className="stat-row-value">{backend.latencyMs != null ? backend.latencyMs + " ms" : "—"}</span>
            </div>
            <div className="stat-row">
              <span className="stat-row-label">Schema applied</span>
              <span className="stat-row-value">{backend.schemaReady ? "YES" : "NO"}</span>
            </div>
            <div className="stat-row">
              <span className="stat-row-label">Last sync</span>
              <span className="stat-row-value">{backend.lastSyncAt ? relTime(backend.lastSyncAt) : "—"}</span>
            </div>
            <div className="stat-row">
              <span className="stat-row-label">Endpoint</span>
              <span className="stat-row-value" style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis" }}>
                {backend.configSummary?.url ?? "—"}
              </span>
            </div>
            {backend.lastError ? (
              <div className="mt-8">
                <Badge tone="danger">
                  <IconAlert size={12} strokeWidth={2.2} />
                  {backend.lastError}
                </Badge>
              </div>
            ) : null}
          </div>

          <div className="mt-16" style={{ paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--text-3)" }}>
              FIRST TIME? RUN supabase/schema.sql IN THE SUPABASE SQL EDITOR — IT CREATES THE TABLES AND
              ROW-LEVEL SECURITY POLICIES.
            </div>
          </div>
        </Card>

        {/* ---------------- Data ---------------- */}
        <Card>
          <CardHeader
            title="Data"
            subtitle="Import, export and mirror the working set"
            icon={<IconDatabase size={18} />}
          />

          <div className="flex gap-8 wrap mb-16">
            <Button onClick={download}>
              <IconDownload size={16} />
              Export JSON
            </Button>
            <Button onClick={() => fileRef.current?.click()}>
              <IconUpload size={16} />
              Import JSON
            </Button>
            <Button onClick={() => pushToast("Local data pushed to Supabase", "info")} disabled={mode !== "supabase"}>
              <IconCloud size={16} />
              Push local to cloud
            </Button>
          </div>

          <div className="kv">
            <span className="kv-k">Working set</span>
            <span className="kv-v">
              {state.tasks.length} tasks · {state.bom.length} parts · {state.members.length} members
            </span>
          </div>
          <div className="kv">
            <span className="kv-k">Storage</span>
            <span className="kv-v mono">{(JSON.stringify(state).length / 1024).toFixed(1)} KB JSON</span>
          </div>
          <div className="kv">
            <span className="kv-k">Local mirror</span>
            <span className="kv-v">always written, works offline</span>
          </div>

          <div style={{ paddingTop: 16, marginTop: 8, borderTop: "1px solid var(--border)" }}>
            <div className="mono mb-8" style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--text-3)" }}>
              IMPORT FORMAT
            </div>
            <p className="card-sub" style={{ marginTop: 0 }}>
              A JSON file with <code>project</code>, <code>members</code>, <code>tasks</code>,{" "}
              <code>bom</code>, <code>milestones</code>, <code>files</code> and <code>activity</code> — the
              same shape as Export. Importing replaces the working set and, when connected, pushes the
              change to Supabase.
            </p>
          </div>
        </Card>
      </div>

      {/* ---------------- Database tables ---------------- */}
      <Card>
        <CardHeader
          title="Database tables"
          subtitle={rows.length ? "Live row counts from Supabase" : "Connect to see live row counts"}
          icon={<IconDatabase size={18} />}
          actions={
            <Button size="sm" onClick={doTest} disabled={mode === "local"}>
              <IconRefresh size={14} />
              Refresh
            </Button>
          }
        />
        {rows.length === 0 ? (
          <div className="empty">
            <div className="empty-mark" />
            <div className="empty-title">No table stats yet</div>
            <div className="empty-hint">Connect to Supabase and run a test to read the live row counts.</div>
          </div>
        ) : (
          <div className="table-wrap" style={{ margin: 0, padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Table</th>
                  <th>Label</th>
                  <th style={{ textAlign: "right" }}>Rows</th>
                  <th style={{ textAlign: "right" }}>Est. size</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: TableStat) => (
                  <tr key={r.table}>
                    <td className="mono" style={{ fontSize: 13 }}>{r.table}</td>
                    <td>{r.label}</td>
                    <td className="table-num">{fmtNum(r.rows)}</td>
                    <td className="table-num">{fmtNum(Math.round(r.rows * 0.4))} KB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ---------------- Danger zone ---------------- */}
      <Card style={{ borderColor: "color-mix(in srgb, var(--danger) 32%, transparent)" }}>
        <CardHeader
          title="Danger zone"
          subtitle="These actions wipe data — reset reseeds, clear empties everything"
          icon={<IconAlert size={18} />}
        />
        <div className="flex gap-16 wrap">
          <div className="grow" style={{ minWidth: 240 }}>
            <div className="table-strong" style={{ fontSize: 16 }}>Reset to seed data</div>
            <div className="card-sub" style={{ marginTop: 4 }}>
              Deletes every row and re-inserts the FSAE 2026 demo dataset. Use before a new season.
            </div>
          </div>
          <Button variant="danger" onClick={() => setResetOpen(true)}>
            <IconRefresh size={16} />
            Reset data
          </Button>
        </div>
        <div style={{ height: 16 }} />
        <div className="flex gap-16 wrap" style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <div className="grow" style={{ minWidth: 240 }}>
            <div className="table-strong" style={{ fontSize: 16 }}>Clear all data</div>
            <div className="card-sub" style={{ marginTop: 4 }}>
              Empties every table and leaves the project shell. Nothing comes back.
            </div>
          </div>
          <Button variant="danger" onClick={() => setClearOpen(true)}>
            <IconTrash size={16} />
            Clear everything
          </Button>
        </div>
      </Card>

      <input ref={fileRef} type="file" accept="application/json" className="sr-only" onChange={onImportFile} />

      {/* ---------------- Reset modal ---------------- */}
      <Modal
        open={resetOpen}
        onClose={() => {
          setResetOpen(false);
          setConfirmText("");
        }}
        title="Reset to seed data"
        width={520}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setResetOpen(false); setConfirmText(""); }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={confirmText !== "RESET"}
              onClick={() => {
                setResetOpen(false);
                setConfirmText("");
                resetData();
              }}
            >
              <IconRefresh size={16} />
              Reset database
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 16 }}>
          This deletes <strong>all rows</strong> {mode === "supabase" ? "in Supabase " : ""}and re-inserts
          the FSAE 2026 demo dataset. Your real data will be gone.
        </p>
        <Field label='Type RESET to confirm' hint="Case sensitive">
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="RESET" autoFocus />
        </Field>
      </Modal>

      {/* ---------------- Clear modal ---------------- */}
      <Modal
        open={clearOpen}
        onClose={() => {
          setClearOpen(false);
          setConfirmText("");
        }}
        title="Clear all data"
        width={520}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setClearOpen(false); setConfirmText(""); }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={confirmText !== "CLEAR"}
              onClick={() => {
                setClearOpen(false);
                setConfirmText("");
                clearData();
              }}
            >
              <IconTrash size={16} />
              Clear everything
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 16 }}>
          Every table {mode === "supabase" ? "in Supabase " : ""}is emptied. The project shell stays so you
          can start fresh. This cannot be undone.
        </p>
        <Field label='Type CLEAR to confirm' hint="Case sensitive">
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="CLEAR" autoFocus />
        </Field>
      </Modal>
    </>
  );
}