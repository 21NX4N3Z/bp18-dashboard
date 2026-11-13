# BP18 · Frame & Body Control

Internal project dashboard for **BlackPearl FSAE — Frame & Body subsystem** (BP18, FSAE 2026 season).
Task board, bill of materials, weight budget, season milestones, team load, file index, analytics and a
workshop TV display — in one self-contained web app.

Built with **Vite + React 19 + TypeScript + plain CSS design system**. No backend, no database: the app
ships with a seeded dataset and persists every mutation to `localStorage`, so it runs anywhere it is
deployed and needs zero configuration.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build (single self-contained HTML file):

```bash
npm run build      # -> dist/index.html  (CSS + JS + fonts inlined)
npm run preview    # serve the built file locally
```

## Deploy

The repo is Vercel-ready (`vercel.json` sets the Vite framework, build command and SPA rewrite):

```bash
vercel deploy --prod --yes
```

## What is inside

| Page | What it does |
| --- | --- |
| **Overview** | Season hero with countdown, KPI row, weight-growth chart, task-status donut, subsystem weight budget vs actual, critical attention list, season timeline, activity feed, team load, material mix |
| **Tasks** | Table + Kanban views, search, status/priority/assignee filters, sorting, full CRUD, inline status advance, optimistic updates |
| **Milestones** | Vertical season timeline from kickoff to endurance, status filters, add/edit/delete |
| **BOM** | Cost and weight rollup, assembly/material/vendor/manufacturing filters, CSV export, line totals, cost rollup by assembly |
| **Analytics** | Status/priority/due-load breakdowns, cost by assembly and material, mass by assembly, supply-chain and manufacturing state, schedule state, team workload |
| **Team** | Roster with roles, subsystems, per-member open/critical/done load |
| **Files** | Drawing/CAD/report register with category filters and size totals |
| **TV mode** | Full-screen workshop display, auto-rotating focus, arrow-key navigation |

### Global features

- **Command palette** — `Ctrl/Cmd + K` to navigate, jump to any task or part, toggle theme, export or reset data
- **TV mode** — `Ctrl/Cmd + T`, `Esc` to exit
- **Theme** — machine-dark by default, daylight on toggle; persisted
- **Deep links** — every page has a `#/page` hash, so refresh and shared links land on the same view
- **Data menu** — export the whole dataset as JSON, import it back, or reset to the seed
- **Optimistic UI** — every mutation updates instantly and writes to the local store in the background
- **Activity log** — every mutation is recorded and surfaced in the overview feed

## Architecture

```
src/
  lib/
    types.ts     domain model (Project, Member, Task, BomPart, Milestone, FileItem, Activity)
    seed.ts      deterministic seed dataset (FSAE 2026 season)
    store.tsx    React context store + localStorage persistence + mutation actions + toasts
    derive.ts    selectors: KPIs, chart series, workload, rollups
    format.ts    labels, units, dates, relative time
  components/
    icons.tsx    inline SVG icon set (no emoji anywhere)
    ui.tsx       design-system primitives (Card, Badge, Button, Modal, Switch, Segmented, Ring, ...)
    charts.tsx   hand-rolled SVG charts (area, columns, donut, hbars, sparkline) with aria labels
    shell.tsx    sidebar, topbar, command palette, toasts
  pages/         one file per page
  fonts.css      self-hosted Barlow Condensed + IBM Plex Mono (latin subset, inlined)
  index.css      token-driven design system (:root light / .dark dark)
scripts/
  postbuild.mjs  single-file hardening step (see file header)
```

### Data model

All data lives in one `DataState` object (`project`, `members`, `tasks`, `bom`, `milestones`, `files`,
`activity`) serialised to `localStorage` under `bp18.dashboard.v2`. The seed is rebuilt whenever the
stored payload is missing or fails validation, so a corrupted store self-heals.

### Design system

Two token themes (`:root` light, `.dark` dark) drive every colour. Numbers are IBM Plex Mono with
`tabular-nums`; labels are Barlow Condensed uppercase; body is the system sans stack. Spacing follows a
4-point grid, one accent per view, no emoji, no glow, status always paired with an icon and a text label.

## Verification

`npm run build` runs `tsc --noEmit` before Vite. The built file is a single HTML document, so it can be
checked directly:

```bash
# extract the inlined module bundle and syntax-check it
node --check <(sed -n '/<script type="module"/,/<\/script>/p' dist/index.html)
```

The UI standards gate (ui-standards skill) passes 12/12 on every page: no emoji, tokens declared in both
themes, 4-point grid, `:focus-visible` ring, `prefers-reduced-motion`, `role="switch"` + `aria-checked`,
one `h1`, `tabular-nums`, no purple/glow, no bare `outline:none`, no `tabindex > 0`.
Text contrast is ≥ 4.5:1 in both themes (verified numerically for body, support, badge, nav and status text).

## Team

Frame & Body subsystem — BlackPearl FSAE, KMUTT.
Members are managed inside the dashboard; contact the lead for access.
