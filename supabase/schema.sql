-- ============================================================================
-- BP18 · Frame & Body Control — Supabase schema
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Safe to re-run: every statement is idempotent.
-- ============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------- members --------------------------------------------------------
create table if not exists app_members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null default '',
  role        text not null default 'engineer'
              check (role in ('admin','engineer','viewer')),
  position    text not null default '',
  subsystem   text not null default '',
  created_at  timestamptz not null default now()
);

-- ---------- tasks ----------------------------------------------------------
create table if not exists app_tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  status      text not null default 'todo'
              check (status in ('todo','in-progress','review','done')),
  priority    text not null default 'medium'
              check (priority in ('low','medium','high','critical')),
  tags        text[] not null default '{}',
  assignee_id uuid references app_members(id) on delete set null,
  due         timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists app_tasks_status_idx    on app_tasks(status);
create index if not exists app_tasks_assignee_idx  on app_tasks(assignee_id);
create index if not exists app_tasks_due_idx       on app_tasks(due);

-- ---------- bill of materials ----------------------------------------------
create table if not exists app_bom_parts (
  id            uuid primary key default gen_random_uuid(),
  part_name     text not null,
  part_number   text not null default '',
  assembly      text not null default '',
  material      text not null default '',
  quantity      integer not null default 1 check (quantity >= 0),
  unit_weight   integer not null default 0 check (unit_weight >= 0),  -- grams
  unit_cost     integer not null default 0 check (unit_cost >= 0),    -- THB
  vendor_status text not null default 'ordering'
                check (vendor_status in ('ordering','shipping','received','qc_passed','qc_failed')),
  mfg_status    text not null default 'waiting'
                check (mfg_status in ('waiting','cutting','welding','machining','done')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists app_bom_parts_assembly_idx on app_bom_parts(assembly);
create index if not exists app_bom_parts_material_idx on app_bom_parts(material);

-- ---------- milestones -----------------------------------------------------
create table if not exists app_milestones (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  due_date    timestamptz,
  status      text not null default 'pending'
              check (status in ('completed','pending','delayed','at-risk')),
  created_at  timestamptz not null default now()
);
create index if not exists app_milestones_status_idx on app_milestones(status);

-- ---------- files ----------------------------------------------------------
create table if not exists app_files (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null default '',
  type        text not null default '',
  size        bigint not null default 0,
  updated_at  timestamptz not null default now()
);
create index if not exists app_files_category_idx on app_files(category);

-- ---------- activity log ---------------------------------------------------
create table if not exists app_activity (
  id          uuid primary key default gen_random_uuid(),
  message     text not null,
  type        text not null default 'system',
  actor_id    uuid references app_members(id) on delete set null,
  timestamp   timestamptz not null default now()
);
create index if not exists app_activity_timestamp_idx on app_activity(timestamp desc);

-- ---------- project (single row) -------------------------------------------
create table if not exists app_project (
  id                 integer primary key default 1,
  name               text not null,
  season             text not null,
  competition_date   timestamptz,
  target_weight      numeric(8,2) not null default 0,   -- kg
  current_weight     numeric(8,2) not null default 0,   -- kg
  subsystem_weights  jsonb not null default '[]',
  weight_history     jsonb not null default '[]',
  material_mix       jsonb not null default '[]',
  updated_at         timestamptz not null default now(),
  constraint app_project_single_row check (id = 1)
);

-- ---------- meta (schema version, seed marker) ------------------------------
create table if not exists app_meta (
  key   text primary key,
  value text not null
);
insert into app_meta(key, value) values ('schema_version', '1')
  on conflict (key) do nothing;

-- ============================================================================
-- Row Level Security
-- The app uses the public anon key, so RLS is what actually protects the data.
-- These policies make the tables usable by the dashboard. Tighten them (e.g.
-- restrict to authenticated users, or add a team_id column) before opening the
-- project to anyone outside the team.
-- ============================================================================
alter table app_members      enable row level security;
alter table app_tasks        enable row level security;
alter table app_bom_parts    enable row level security;
alter table app_milestones   enable row level security;
alter table app_files        enable row level security;
alter table app_activity     enable row level security;
alter table app_project      enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'app_members','app_tasks','app_bom_parts',
    'app_milestones','app_files','app_activity','app_project'
  ] loop
    execute format('drop policy if exists "app_full_access" on %I', t);
    execute format(
      'create policy "app_full_access" on %I for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;
