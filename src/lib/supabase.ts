import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase connection for the dashboard.
 *
 * Configuration is resolved in this order:
 *   1. runtime entry saved by the in-app Settings panel (localStorage)
 *   2. build-time env vars VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
 *
 * Keeping the key out of the bundle means the shipped file never carries a
 * credential and the project can be pointed at another database without a
 * rebuild. The anon key is public by design — row level security in
 * supabase/schema.sql is what actually guards the tables.
 */

const ENV_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const ENV_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

const STORE_KEY = "bp18.supabase.config.v1";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let client: SupabaseClient | null = null;
let current: SupabaseConfig | null = null;
let onConfigChange: (() => void) | null = null;

function normalise(raw: string): string {
  return raw.replace(/\/+$/, "").trim();
}

function fromEnv(): SupabaseConfig | null {
  if (ENV_URL && ENV_KEY) return { url: normalise(ENV_URL), anonKey: ENV_KEY };
  return null;
}

function fromStorage(): SupabaseConfig | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SupabaseConfig>;
    if (parsed?.url && parsed?.anonKey) {
      return { url: normalise(parsed.url), anonKey: parsed.anonKey.trim() };
    }
  } catch {
    /* corrupted entry -> fall through to env */
  }
  return null;
}

export function resolveConfig(): SupabaseConfig | null {
  return fromStorage() ?? fromEnv();
}

export function getStoredConfig(): SupabaseConfig | null {
  return fromStorage();
}

export function saveConfig(cfg: SupabaseConfig): void {
  const clean = { url: normalise(cfg.url), anonKey: cfg.anonKey.trim() };
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(clean));
  } catch {
    /* storage blocked */
  }
  client = createClient(clean.url, clean.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    db: { schema: "public" },
  });
  current = clean;
  onConfigChange?.();
}

export function clearConfig(): void {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* ignore */
  }
  client = null;
  current = null;
  onConfigChange?.();
}

export function getClient(): SupabaseClient | null {
  if (client) return client;
  const cfg = resolveConfig();
  if (!cfg) return null;
  client = createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    db: { schema: "public" },
  });
  current = cfg;
  return client;
}

export function setConfigListener(fn: () => void): void {
  onConfigChange = fn;
}

export function configSummary(): { url: string; keyTail: string } | null {
  const cfg = current ?? resolveConfig();
  if (!cfg) return null;
  return {
    url: cfg.url,
    keyTail: cfg.anonKey.length > 12 ? "…" + cfg.anonKey.slice(-8) : "…",
  };
}

/** Same summary, derived from the resolved config rather than the client. */
export function clientSummary(_sb: SupabaseClient): { url: string; keyTail: string } | null {
  return configSummary();
}
