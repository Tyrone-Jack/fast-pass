# FastPass

Digital access verification for logistics drivers at gated facilities.

A driver logs in on their phone, scans the QR code mounted at a gate, and
the backend verifies them against their organization's records in under a
second — producing an `ALLOW` / `DENY` decision and an immutable audit log
entry.

---

## Stack

| Layer | Tech |
|-------|------|
| API | Node.js 20, Express 5, PostgreSQL 16, TypeScript |
| Web | React 18, Vite, Tailwind, TanStack Query |
| Shared | Zod schemas + TypeScript types (single source of truth) |
| Infra | Docker Compose (Postgres in dev, full stack in prod) |
| Tooling | pnpm workspaces, TypeScript project references |

## Repository layout
fast-pass/
├── apps/
│ ├── api/ Express + Postgres API
│ │ ├── src/
│ │ │ ├── config/ Env validation
│ │ │ ├── db/ Postgres pool
│ │ │ ├── middleware/ Auth guard, error handler
│ │ │ └── modules/
│ │ │ ├── auth/ POST /auth/login, /logout, GET /me
│ │ │ ├── organizations/ CRUD
│ │ │ ├── drivers/ CRUD (under an org)
│ │ │ ├── gates/ CRUD + QR token
│ │ │ ├── verification/ POST /verification/scan-gate ← core
│ │ │ └── reports/ GET /reports/gate/:id.pdf, /reports/org/:id.csv
│ │ ├── migrations/ node-pg-migrate SQL migrations
│ │ └── Dockerfile
│ └── web/ React SPA
│ ├── src/
│ │ ├── lib/ API client + auth context
│ │ └── pages/ Admin, Driver (scanner), Gate, Login
│ └── Dockerfile
├── packages/
│ └── shared/ Zod schemas shared by api & web
├── infra/
│ └── docker-compose.yml Dev Postgres
├── docs/
│ ├── spec.md Original spec (v1)
│ └── spec-v2.md Current spec
├── docker-compose.yml Full-stack production compose
└── package.json

text

---

## Prerequisites

- **Node.js 20+** (`nvm use` reads `.nvmrc`)
- **pnpm 9+** (`corepack enable`)
- **Docker Desktop** (for Postgres)

## Getting started

### 1. Install dependencies

```bash
pnpm install
2. Configure the API environment
bash
cp apps/api/.env.example apps/api/.env
The default values work for local development.

3. Start Postgres
bash
docker compose -f infra/docker-compose.yml up -d
Verify it's healthy:

bash
docker ps
# fastpass-db ... Up (healthy) ... 0.0.0.0:5432->5432/tcp
4. Run database migrations
bash
pnpm --filter @fast-pass/api db:migrate
This creates all tables (organizations, drivers, gates,
access_logs, sessions, gate_authorized_organizations) and seeds
a __SYSTEM__ driver used for logging verification attempts that can't
be attributed to a real driver.

5. Start the dev servers
Two terminals:

bash
# Terminal 1 — API
pnpm --filter @fast-pass/api dev
# → http://localhost:4000

# Terminal 2 — Web
pnpm --filter @fast-pass/web dev
# → http://localhost:5173
Open http://localhost:5173.

Using FastPass
The app has three areas, reachable from the top nav.

Admin (/admin)
Set up the system.

Create an organization with a name and purpose
(e.g. "ABC Logistics" / "Package delivery").

Create a driver under that org — name, phone, email, password.

Create a gate — name and location. The system generates a
unique QR token automatically.

Gate (/gate)
Set up the physical gate.

Select the gate you created.

The page shows the gate token and a printable QR code.

Print the QR and mount it at the physical gate entrance.

Drivers scan this QR.

Driver (/driver)
The driver's flow, on their own phone.

Log in with the email + password an admin created.

Open camera — or paste the gate token manually.

Scan the QR at the gate.

ALLOW or DENY appears in under a second.

Every attempt — success or failure — is written to access_logs.

Reports
Gate PDF
On the Gate page, select a gate and click Download access log PDF.
The PDF contains every verification attempt at that gate, including
denials with reasons.

Direct URL:

text
GET /api/v1/reports/gate/:gateId.pdf
Organization CSV
text
GET /api/v1/reports/org/:orgId.csv
Columns: driver, gate, gate_location, result, reason, purpose, verified_at.

API overview
Base URL: /api/v1

Auth
Method	Path	Description
POST	/auth/login	Email + password → session cookie
POST	/auth/logout	Clear session
GET	/auth/me	Current driver
Resources
Method	Path	Description
POST	/organizations	Create org (name, purpose)
GET	/organizations	List
POST	/organizations/:orgId/drivers	Create driver
GET	/organizations/:orgId/drivers	List org's drivers
POST	/gates	Create gate (auto-generates QR token)
GET	/gates	List
POST	/verification/scan-gate	The core call — body { gateToken }, requires driver session
GET	/reports/gate/:id.pdf	Gate audit PDF
GET	/reports/org/:id.csv	Org audit CSV
Verification rules
In order (from spec v2 §3):

Session valid → else UNAUTHENTICATED

Gate exists and is ACTIVE → else GATE_NOT_FOUND / GATE_INACTIVE

Driver exists and is ACTIVE → else DRIVER_INACTIVE

Organization is ACTIVE → else ORGANIZATION_INACTIVE

Organization authorized for this gate → else GATE_NOT_AUTHORIZED

Result: ALLOW or DENY with a machine-readable reason.

Scripts
Root
Command	Description
pnpm dev	Run all apps in watch mode
pnpm build	Build all packages
pnpm typecheck	Type-check all packages
pnpm test	Run all tests
API (--filter @fast-pass/api)
Command	Description
dev	Run with hot reload (tsx watch)
build	Compile TypeScript to dist/
start	Run the compiled build
db:migrate	Apply pending migrations
db:rollback	Roll back the last migration
db:create <name>	Create a new migration file
test	Run tests
Web (--filter @fast-pass/web)
Command	Description
dev	Vite dev server with API proxy
build	Production build to dist/
preview	Serve the production build
typecheck	Type-check
Production build
Build both apps locally and run them without dev tooling.

bash
# Build
pnpm --filter @fast-pass/shared build
pnpm --filter @fast-pass/api build
pnpm --filter @fast-pass/web build

# Run API (Terminal 1)
cd apps/api
node dist/server.js

# Run web (Terminal 2)
cd apps/web
pnpm preview
# → http://localhost:4173
For a full Docker-based production run:

bash
docker compose -f docker-compose.yml up --build
The compose file builds the API and web Dockerfiles, wires them to a
Postgres container, and exposes the web app on port 8080.

Note: Docker builds require network access to registry.npmjs.org.
On networks behind a proxy, export HTTP_PROXY / HTTPS_PROXY before
running the build — the Dockerfiles accept them as build args.

Testing the verification flow without a browser
Useful for smoke tests and CI.

bash
BASE=http://localhost:4000/api/v1
JAR=/tmp/fp.txt; rm -f $JAR

# 1. Create an org
ORG=$(curl -s -X POST $BASE/organizations \
  -H "Content-Type: application/json" \
  -d '{"name":"ABC Logistics","purpose":"Package delivery"}' \
  | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# 2. Create a driver
curl -s -X POST $BASE/organizations/$ORG/drivers \
  -H "Content-Type: application/json" \
  -d '{"name":"John Kamau","phone":"+254700000000","email":"john@abc.example","password":"testpass123"}'

# 3. Create a gate and capture its token
TOKEN=$(curl -s -X POST $BASE/gates \
  -H "Content-Type: application/json" \
  -d '{"name":"Gate #01","location":"ABC Distribution Centre"}' \
  | grep -o '"qrToken":"[^"]*"' | cut -d'"' -f4)

# 4. Log in
curl -s -c $JAR -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@abc.example","password":"testpass123"}'

# 5. Scan
curl -s -b $JAR -X POST $BASE/verification/scan-gate \
  -H "Content-Type: application/json" \
  -d "{\"gateToken\":\"$TOKEN\"}"
# → {"result":"ALLOW", ...}
Conventions
Commits follow Conventional Commits

Branches — feat/<name>, fix/<name>, chore/<name>

Never commit directly to main

Database changes ship as migrations — never edit the DB by hand

Secrets live in .env — .env.example is the source of truth for
what a deployment needs

Product spec
docs/spec-v2.md — current specification

docs/spec.md — original v1 spec, kept for history

MVP in one sentence: A driver logs in on their phone, scans the QR
code mounted at a gate, and the backend verifies them against their
organization's records in under a second — producing an ALLOW or
DENY decision and an immutable audit log entry.
