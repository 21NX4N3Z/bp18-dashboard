/**
 * Minimal PostgREST-compatible mock of the Supabase REST API.
 *
 * Purpose: exercise the dashboard's real Supabase data layer (mappers, diff
 * sync, reset, counts) without a Supabase project, so the sync path can be
 * verified before credentials exist. NOT a production service — data lives in
 * memory and dies with the process.
 *
 * Usage:
 *   node scripts/mock-supabase.mjs [port]      # default 9999
 * Then in the app: System → URL http://localhost:9999, any anon key, Save & connect.
 */
import http from "node:http";

const PORT = Number(process.argv[2]) || 9999;

/** @type {Record<string, Record<string, any>[]>} */
const tables = {
  app_members: [],
  app_tasks: [],
  app_bom_parts: [],
  app_milestones: [],
  app_files: [],
  app_activity: [],
  app_project: [],
  app_meta: [{ key: "schema_version", value: "1" }],
};

const SCHEMA = {
  app_members: ["id", "name", "email", "role", "position", "subsystem", "created_at"],
  app_tasks: ["id", "title", "status", "priority", "tags", "assignee_id", "due", "created_at", "updated_at"],
  app_bom_parts: [
    "id", "part_name", "part_number", "assembly", "material", "quantity",
    "unit_weight", "unit_cost", "vendor_status", "mfg_status", "created_at", "updated_at",
  ],
  app_milestones: ["id", "name", "due_date", "status", "created_at"],
  app_files: ["id", "name", "category", "type", "size", "updated_at"],
  app_activity: ["id", "message", "type", "actor_id", "timestamp"],
  app_project: [
    "id", "name", "season", "competition_date", "target_weight", "current_weight",
    "subsystem_weights", "weight_history", "material_mix", "updated_at",
  ],
  app_meta: ["key", "value"],
};

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function now() {
  return new Date().toISOString();
}

function applyDefaults(table, row) {
  const out = { ...row };
  for (const col of SCHEMA[table]) {
    if (out[col] === undefined) {
      if (col === "id") out[col] = uuid();
      else if (col === "created_at" || col === "updated_at" || col === "timestamp") out[col] = now();
      else if (col === "tags") out[col] = [];
      else if (col === "subsystem_weights" || col === "weight_history" || col === "material_mix") out[col] = [];
      else if (col === "size") out[col] = 0;
      else if (col === "quantity" || col === "unit_weight" || col === "unit_cost") out[col] = 0;
      else if (col === "target_weight" || col === "current_weight") out[col] = 0;
      else out[col] = null;
    }
  }
  if (table === "app_project") out.id = 1;
  return out;
}

function parseFilter(query, key) {
  const raw = query.get(key);
  if (!raw) return null;
  const m = raw.match(/^(eq|neq|gt|gte|lt|lte|in)\.(.+)$/);
  if (!m) return null;
  const [, op, value] = m;
  if (op === "in") {
    const inner = value.replace(/^\((.*)\)$/, "$1");
    const parts = inner.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
    return { op, values: parts };
  }
  return { op, value: value.replace(/^"|"$/g, "") };
}

function match(row, filters) {
  for (const f of filters) {
    if (!f) continue;
    const v = row[f.key];
    if (f.op === "eq" && String(v) !== f.value) return false;
    if (f.op === "neq" && String(v) === f.value) return false;
    if (f.op === "in" && !f.values.includes(String(v))) return false;
    if (f.op === "gt" && !(v > f.value)) return false;
    if (f.op === "lt" && !(v < f.value)) return false;
  }
  return true;
}

function send(res, status, body, headers = {}) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,HEAD,OPTIONS",
    ...headers,
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "OPTIONS") return send(res, 204, undefined);

  // auth probe used by supabase-js on some paths
  if (url.pathname.startsWith("/auth/")) return send(res, 200, { access_token: "mock", user: null });
  if (url.pathname.startsWith("/rest/v1/") === false && url.pathname !== "/rest/v1") {
    return send(res, 404, { message: "not found", path: url.pathname });
  }

  const parts = url.pathname.replace(/^\/rest\/v1\/?/, "").split("/").filter(Boolean);
  const table = parts[0];
  if (!table) {
    return send(res, 200, {
      name: "bp18-mock",
      tables: Object.keys(SCHEMA),
      definitions: Object.fromEntries(Object.entries(SCHEMA).map(([k, v]) => [k, { columns: v }])),
    });
  }
  if (!SCHEMA[table]) return send(res, 404, { message: `relation "${table}" does not exist`, code: "42P01" });

  const query = url.searchParams;
  const filters = [...query.keys()]
    .filter((k) => !["select", "order", "limit", "offset", "apikey"].includes(k))
    .map((k) => parseFilter(query, k))
    .map((f, i) => (f ? { ...f, key: [...query.keys()].filter((k) => !["select", "order", "limit", "offset", "apikey"].includes(k))[i] } : null))
    .filter(Boolean);

  const prefer = req.headers["prefer"] ?? "";

  if (req.method === "GET" || req.method === "HEAD") {
    let rows = tables[table].filter((r) => match(r, filters));
    const order = query.get("order");
    if (order) {
      const [col, dir] = order.split(".");
      rows = [...rows].sort((a, b) => {
        const av = a[col] ?? "";
        const bv = b[col] ?? "";
        return av < bv ? -1 : av > bv ? 1 : 0;
      });
      if (dir === "desc") rows.reverse();
    }
    const total = rows.length;
    const limit = Number(query.get("limit") ?? 0);
    if (limit) rows = rows.slice(0, limit);

    if (query.get("select") === "*" && prefer.includes("count=exact")) {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Range": `0-${Math.max(0, total - 1)}/${total}`,
        "Access-Control-Allow-Origin": "*",
      });
      return res.end("");
    }
    if (req.method === "HEAD") {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Range": `*/${total}`,
        "Access-Control-Allow-Origin": "*",
      });
      return res.end("");
    }
    return send(res, 200, rows);
  }

  if (req.method === "POST") {
    const body = await new Promise((resolve) => {
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", () => {
        try {
          resolve(raw ? JSON.parse(raw) : []);
        } catch {
          resolve([]);
        }
      });
    });
    const rowsIn = Array.isArray(body) ? body : [body];
    const upsert = prefer.includes("resolution=merge-duplicates");
    const written = [];
    for (const raw of rowsIn) {
      const row = applyDefaults(table, raw);
      const idx = tables[table].findIndex((r) => r.id === row.id);
      if (idx >= 0 && upsert) {
        tables[table][idx] = { ...tables[table][idx], ...row };
        written.push(tables[table][idx]);
      } else if (idx >= 0) {
        return send(res, 409, { message: `duplicate key value violates unique constraint "${table}_pkey"` });
      } else {
        tables[table].push(row);
        written.push(row);
      }
    }
    return send(res, 201, written, { "Content-Range": `*/${tables[table].length}` });
  }

  if (req.method === "DELETE") {
    const idFilter = parseFilter(query, "id");
    if (idFilter?.op === "in") {
      tables[table] = tables[table].filter((r) => !idFilter.values.includes(String(r.id)));
    } else if (idFilter?.op === "eq") {
      tables[table] = tables[table].filter((r) => String(r.id) !== idFilter.value);
    } else {
      tables[table] = [];
    }
    return send(res, 204, undefined);
  }

  if (req.method === "PATCH" || req.method === "PUT") {
    const body = await new Promise((resolve) => {
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", () => resolve(raw ? JSON.parse(raw) : {}));
    });
    const idFilter = parseFilter(query, "id");
    tables[table] = tables[table].map((r) => {
      const hit = idFilter ? (idFilter.op === "eq" ? String(r.id) === idFilter.value : true) : true;
      return hit ? { ...r, ...body, id: r.id } : r;
    });
    const rows = tables[table].filter((r) => (idFilter?.op === "eq" ? String(r.id) === idFilter.value : true));
    return send(res, 200, rows);
  }

    return send(res, 405, { message: "method not allowed" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`mock Supabase REST API on http://127.0.0.1:${PORT}/rest/v1`);
  console.log("tables:", Object.keys(SCHEMA).join(", "));
});
