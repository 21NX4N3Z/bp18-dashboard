# BP18 Frame & Body Dashboard

Internal project dashboard for BlackPearl FSAE — Frame & Body subsystem.
Task tracking, BOM, milestones, members, activity feed, analytics, and TV mode in one place.

![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

## Features

- **Tasks** — full CRUD with status/priority/subsystem filters, search, pagination
- **BOM** — bill of materials per assembly with cost rollup
- **Milestones** — season timeline from kickoff to competition
- **Members** — roster with roles, positions, subsystem assignment
- **Analytics** — tasks by status, cost by part group, weight budget, risk scores (Recharts)
- **Activity feed** — automatic audit log of every mutation
- **TV mode** — big-screen view for the workshop display
- **Optimistic UI** — instant feedback on every mutation

## Quick Start

```bash
git clone https://github.com/21NX4N3Z/bp18-dashboard.git
cd bp18-dashboard
npm install

# start MongoDB
docker compose up -d

# environment
cp .env.example .env   # set MONGODB_URI if not default

# seed mock data (tasks, BOM, members, milestones)
npm run seed

npm run dev
```

Open http://localhost:3000

## Project Structure

```
app/
  api/            # REST routes: tasks, bom, projects, members,
                  # milestones, activity, files, health, cron
  dashboard/      # main dashboard page
  tv/             # TV mode (workshop display)
components/
  AnalyticsWidgets.tsx
  DashboardWidgets.tsx
  Sidebar.tsx
lib/
  models/         # Mongoose: Task, BOM, Project, User,
                  # ActivityLog, File, ErrorLog
  mongodb.ts      # connection singleton
scripts/          # db seed
docker-compose.yml
```

## API Overview

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/tasks` | GET POST | list / create tasks |
| `/api/tasks/[id]` | PATCH DELETE | update / delete |
| `/api/bom` | GET POST | BOM entries |
| `/api/projects` | GET | project metadata |
| `/api/members` | GET | team roster |
| `/api/milestones` | GET | season timeline |
| `/api/activity` | GET | audit log |
| `/api/files` | GET POST | document storage |
| `/api/health` | GET | service health |

## Scripts

| Command | Action |
|---------|--------|
| `npm run dev` | dev server |
| `npm run build` | production build |
| `npm run lint` | ESLint |
| `npm run seed` | reset + seed MongoDB |

## Team

Frame & Body subsystem — BlackPearl FSAE, KMUTT.
Members are managed inside the dashboard; contact the lead for access.
