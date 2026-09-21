# FastPass — MVP Specification (v2)

> **Amendment to spec.md.** The original spec (v1) described a
> guard-scans-driver's-QR workflow. After a UX review, the workflow has
> been inverted. This document supersedes the flow in v1 Sections 3–6
> and 11. All other sections of v1 (data model, security principles,
> out-of-scope items, definition of done) remain in force unless
> explicitly changed here.

---

## 1. Why the change

**v1 workflow:** driver creates request → driver shows QR → guard scans → backend verifies.

**Problem:** the guard is on the critical path. Every driver needs a human to scan them. That defeats the purpose of "FastPass."

**v2 workflow:** driver arrives at gate → driver scans the QR mounted at the gate → backend verifies → driver sees ALLOW/DENY in under a second.

**Result:** the gate operator is no longer in the loop. The gate is passive infrastructure — a printed QR code and a reporting view. The driver is the actor. The backend does the verification.

This is what the product name promises: a fast pass through the gate.

---

## 2. Actors (v2)

| Actor | Responsibility |
|-------|----------------|
| **Driver** | Logs in on their own device, scans the gate's QR code, sees the result |
| **Gate Operator** | Watches the driver's phone; reviews access logs; exports PDFs |
| **Logistics Organization** | Registers drivers, configures its purpose; exports CSV reports |
| **FastPass Admin** | Registers organizations and gates; prints each gate's QR |
| **FastPass Backend** | Authenticates, verifies, logs |

The gate operator **does not scan anything.** They are observers.

---

## 3. Primary flow (v2)

### UC-01 — Register Organization (unchanged)
Admin creates an organization. In v2 the organization also has a
`purpose` field (single text, e.g. "Package delivery") that is recorded
on every access log entry for that org's drivers.

### UC-02 — Register Driver (extended)
Org creates a driver with `name`, `phone`, `email`, `password` (temp).
Driver can then log in at `/driver`.

### UC-03 — Register Gate (extended)
Admin creates a gate with `name`, `location`.
System generates a unique, unguessable `qr_token` for the gate.
Admin can view the QR code and print it.

### UC-04 — Driver logs in
Driver visits `/driver`, enters email + password.
Backend sets a session cookie (httpOnly, secure, sameSite=lax).

### UC-05 — Driver scans gate QR
Driver (authenticated) opens the scanner on their phone.
The gate's QR encodes `fastpass://gate/<qr_token>`.
Phone parses the token and calls `POST /api/v1/verification/scan-gate`
with `{ gateToken }` and the session cookie.

### UC-06 — Backend verifies (target: <1s)
Backend checks, in order:
1. Session valid → else `UNAUTHENTICATED`
2. Gate exists and is ACTIVE → else `GATE_NOT_FOUND` / `GATE_INACTIVE`
3. Driver exists and is ACTIVE → else `DRIVER_INACTIVE`
4. Driver's organization is ACTIVE → else `ORGANIZATION_INACTIVE`
5. Driver's organization is authorized for this gate → else `NOT_AUTHORIZED`
6. (Optional) Driver is not currently flagged → else `DRIVER_FLAGGED`

### UC-07 — Result delivered to driver
Big ALLOW or DENY on driver's phone with reason for DENY.

### UC-08 — Every attempt logged
Every scan (ALLOW or DENY) writes exactly one row to `access_logs`.

### UC-09 — Gate PDF report
Gate operator visits the gate dashboard and downloads a PDF of all
verification attempts (including denials and reasons).

### UC-10 — Organization CSV report
Org admin visits their report page and downloads a CSV of all their
drivers' gate entries: driver, gate, purpose, result, timestamp.

---

## 4. Gate authorization (new concept)

A gate belongs to a facility. A facility may accept drivers from
multiple logistics organizations. For MVP we model this as
`gate_authorized_organizations` — a join table.

- If no organizations are explicitly authorized for a gate, **all active
  organizations** are authorized (open gate). This is the default.
- If at least one organization is authorized, only those are allowed.

This gives ops flexibility without adding UI complexity for the MVP.

---

## 5. Data model changes from v1

### organizations (add)
- `purpose` TEXT NOT NULL DEFAULT 'Delivery'

### drivers (add)
- `email` TEXT NOT NULL UNIQUE
- `password_hash` TEXT NOT NULL

### gates (add)
- `qr_token` TEXT NOT NULL UNIQUE

### gate_authorized_organizations (new)
- `gate_id` UUID REFERENCES gates(id) ON DELETE CASCADE
- `organization_id` UUID REFERENCES organizations(id) ON DELETE CASCADE
- PRIMARY KEY (gate_id, organization_id)

### access_requests (drop)
No longer part of the product.

### access_logs (adjust)
- `request_id` → rename to `reference` TEXT, nullable, free-form
  (kept for future use; currently always NULL)
- add `organization_id` UUID NOT NULL REFERENCES organizations(id)
- add `purpose` TEXT NOT NULL (snapshot of org's purpose at scan time)

### sessions (new)
- `id` UUID PRIMARY KEY (session ID)
- `driver_id` UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE
- `expires_at` TIMESTAMPTZ NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- index on `driver_id`, index on `expires_at`

### id (all tables)
Existing tables already use UUID PKs with `gen_random_uuid()`. No change.

---

## 6. API (v2)

### Auth
- `POST /api/v1/auth/login` — email + password → session cookie
- `POST /api/v1/auth/logout` — clears cookie
- `GET  /api/v1/auth/me` — returns the logged-in driver

### Organizations (admin)
- `POST /api/v1/organizations` — name, purpose
- `GET  /api/v1/organizations`
- `GET  /api/v1/organizations/:id`

### Drivers
- `POST /api/v1/organizations/:orgId/drivers` — name, phone, email, password
- `GET  /api/v1/drivers/:id`
- `GET  /api/v1/organizations/:orgId/drivers`

### Gates
- `POST /api/v1/gates` — name, location
- `GET  /api/v1/gates`
- `GET  /api/v1/gates/:id`
- `GET  /api/v1/gates/:id/qr` — returns SVG or PNG of the QR code
- `POST /api/v1/gates/:id/rotate-token` — regenerates qr_token

### Verification
- `POST /api/v1/verification/scan-gate`
  Body: `{ "gateToken": "..." }`
  Auth: session cookie (driver)
  Response ALLOW: `{ result, driver, organization, gate, purpose, verifiedAt }`
  Response DENY:  `{ result, reason, verifiedAt }`

### Reports
- `GET /api/v1/reports/gate/:gateId.pdf` — PDF of logs for a gate
- `GET /api/v1/reports/org/:orgId.csv` — CSV of an org's drivers' logs

### Access logs
- `GET /api/v1/access-logs` — filterable by gate, driver, result, date range
- `GET /api/v1/access-logs/:id`

---

## 7. Definition of done (v2)

The MVP is complete when the following is demonstrable end to end:

1. Admin creates an organization with a purpose.
2. Admin creates a driver with email + temp password.
3. Admin creates a gate. System generates a QR token.
4. Admin prints the gate QR.
5. Driver logs in on their phone.
6. Driver scans the gate QR.
7. Backend returns ALLOW in under one second.
8. Driver sees ALLOW on their phone.
9. Attempt is logged.
10. Gate operator downloads a PDF of all attempts.
11. Org admin downloads a CSV of their drivers' entries.

The MVP is **not** complete merely because the QR scanner works.

---

## 8. What carries over from v1

- Modular monolith architecture
- Express + Postgres
- Zod schemas shared between API and web
- Three-layer module pattern (repository / service / routes)
- Immutable access log
- Deny reason codes
- Security principles (Section 12 of v1)
- Out-of-scope list (Section 14 of v1)

## 9. What's new

- Driver authentication via session cookie
- Persistent gate QR token
- Reverse direction of scan
- PDF and CSV reports
- `purpose` snapshot on logs
- `gate_authorized_organizations` for future multi-org gates

## 10. What's removed

- Access request pre-creation (Section 3 UC-04/05 of v1)
- QR codes containing request IDs
- `access_requests` table
