# FastPass

Digital access verification for logistics drivers at gated facilities.

## Product spec

- **[docs/spec-v2.md](./docs/spec-v2.md)** — current specification (driver-initiated verification)
- [docs/spec.md](./docs/spec.md) — original v1 spec, kept for history

**MVP in one sentence:** A driver logs in on their phone, scans the QR
code mounted at a gate, and the backend verifies them against their
organization's records in under a second — producing an ALLOW or DENY
decision and an immutable audit log entry.

## Stack

- **API** — Node.js 20, Express 5, PostgreSQL 16, TypeScript
- **Web** — React 18, Vite, Tailwind, TanStack Query
- **Shared** — Zod schemas + TypeScript types
- **Infra** — Docker Compose
- **Tooling** — pnpm workspaces

## Repository layout
fast-pass/
├── apps/
│ ├── api/ Express + Postgres API
│ └── web/ React frontend
├── packages/
│ └── shared/ Shared Zod schemas
├── infra/
│ └── docker-compose.yml
├── docs/
│ ├── spec.md Original v1 spec
│ └── spec-v2.md Current spec
└── package.json
## Getting started

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
docker compose -f infra/docker-compose.yml up -d
pnpm --filter @fast-pass/api db:migrate
pnpm --filter @fast-pass/api dev    # in one terminal
pnpm --filter @fast-pass/web dev    # in another terminalAPI: http://localhost:4000

Web: http://localhost:5173

Scripts
Command	Description
pnpm dev	Run all apps in watch mode
pnpm build	Build all packages
pnpm typecheck	Type-check all packages
pnpm test	Run tests
Conventions
Commits follow Conventional Commits

Branches: feat/<name>, fix/<name>, chore/<name>

Never commit directly to main
