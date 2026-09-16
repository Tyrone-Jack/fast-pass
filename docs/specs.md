# FastPass MVP Specification

## 1. Product Definition

**FastPass** is a digital access-verification system for logistics businesses and gated facilities.

Its MVP allows a logistics driver to present a QR code at a gate. The gate operator scans the code, FastPass verifies the driver's identity and entry request against registered data, records the verification event, and returns an **ALLOW** or **DENY** decision.

### MVP objective

> Reduce the time and manual effort required to verify logistics drivers at gated locations.

### Core MVP metric

**Verification time:** time from QR scan to verification result.

The MVP should establish a measurable improvement over the customer's existing manual process.

---

# 2. Actors

| Actor                      | Responsibility                                                 |
| -------------------------- | -------------------------------------------------------------- |
| **Driver**                 | Requests/presents access and provides identity information     |
| **Gate Guard**             | Scans the driver's QR code and acts on the verification result |
| **Logistics Organization** | Registers drivers and manages its access information           |
| **FastPass Admin**         | Registers organizations, gates and manages the system          |
| **FastPass Backend**       | Performs verification, authorization and logging               |

### MVP simplification

The **warehouse/property owner** and **logistics company** may initially be represented by the same administrative account if necessary.

Do not build separate organizational hierarchies until the first customer requires them.

---

# 3. Primary Use Cases

## UC-01 — Register Logistics Organization

**Actor:** FastPass Admin

1. Admin creates an organization.
2. System generates a unique organization ID.
3. Organization receives credentials/access to FastPass.

**Result:** FastPass knows which organization owns a driver.

---

## UC-02 — Register Driver

**Actor:** Logistics Organization

1. Organization submits driver details.
2. FastPass validates required information.
3. Driver is associated with the organization.
4. Driver receives a unique driver ID.

Example:

```text
Driver
- id
- name
- phone
- organization_id
- status
```

---

## UC-03 — Register Gate

**Actor:** FastPass Admin

A gate is associated with a physical location.

```text
Gate
- id
- name
- location
- status
```

Example:

```text
Gate #01
ABC Distribution Centre
Nairobi
ACTIVE
```

---

## UC-04 — Create Access Request

**Actor:** Driver / Logistics Application

The driver initiates an access request.

The request contains:

```text
driver
organization
destination/gate
purpose
timestamp
```

Example:

```text
Driver: John Kamau
Company: ABC Logistics
Destination: XYZ Warehouse
Purpose: Package delivery
Created: 10:31
```

The backend creates a **short-lived access token/request ID**.

---

## UC-05 — Generate QR Code

The system generates a QR representation of the access request.

The QR should **not contain sensitive driver information**.

Conceptually:

```text
QR
 ↓
short-lived request/token ID
 ↓
FastPass backend
 ↓
retrieve access request
```

---

## UC-06 — Scan QR at Gate

**Actor:** Gate Guard

1. Guard opens the FastPass gate interface.
2. Guard scans the driver's QR code.
3. FastPass sends the request ID to the backend.
4. Backend retrieves the access request.
5. Backend performs verification.

---

# 4. Verification Rules

The backend should verify, at minimum:

### Identity

```text
Does the driver exist?
```

### Organization

```text
Does the driver belong to the organization
associated with this request?
```

### Request

```text
Does the access request exist?
Has it expired?
Has it already been used?
```

### Destination

```text
Is the driver authorized for this gate/location?
```

### Status

```text
Is the driver active?
Is the organization active?
Is the gate active?
```

The result is:

```text
ALLOW
```

or

```text
DENY
```

---

# 5. Verification Flow

```text
                 DRIVER
                    │
                    │ Creates access request
                    ▼
             FASTPASS BACKEND
                    │
                    │ Generates request
                    ▼
                  QR CODE
                    │
                    │ Driver presents QR
                    ▼
               GATE GUARD
                    │
                    │ Scan
                    ▼
             FASTPASS BACKEND
                    │
          ┌─────────┼──────────┐
          │         │          │
       Driver      Request    Gate
       valid?      valid?     valid?
          │         │          │
          └─────────┼──────────┘
                    │
               Verification
                    │
              ┌─────┴─────┐
              │           │
            ALLOW        DENY
              │           │
              ▼           ▼
          Guard sees   Guard sees
          success      rejection
              │
              ▼
          Access Log
```

### Important design decision

**Scanning the QR does not itself grant access.**

The QR initiates a server-side verification process.

That distinction becomes particularly important when stronger authentication such as WebAuthn/FIDO2 is introduced.

---

# 6. Access Log

Every verification attempt should create an immutable audit record.

```text
AccessLog
- id
- request_id
- driver_id
- organization_id
- gate_id
- result
- reason
- timestamp
```

Example:

```json
{
  "request_id": "req_82F91",
  "driver_id": "drv_104",
  "gate_id": "gate_01",
  "result": "DENIED",
  "reason": "REQUEST_EXPIRED",
  "timestamp": "2026-08-27T09:41:22Z"
}
```

This is important because the product isn't merely saying:

> "Let this guy in."

It is creating a **digital record of who attempted to access what, when, and whether they were authorized.**

---

# 7. Core Data Model

### Organization

```text
organizations
----------------
id
name
status
created_at
```

### Driver

```text
drivers
----------------
id
organization_id
name
phone
status
created_at
```

### Gate

```text
gates
----------------
id
name
location
status
created_at
```

### Access Request

```text
access_requests
----------------
id
driver_id
organization_id
gate_id
purpose
status
expires_at
created_at
```

### Access Log

```text
access_logs
----------------
id
request_id
driver_id
gate_id
result
reason
verified_at
```

---

# 8. System Boundaries

## Inside FastPass MVP

FastPass is responsible for:

* Driver records
* Organization records
* Gate records
* Access requests
* QR/request tokens
* Verification
* Authorization rules
* Access logs
* Basic administrative management

## Outside FastPass MVP

FastPass does **not** initially need to own:

* Logistics fleet management
* Route optimization
* GPS tracking
* Delivery management
* Warehouse inventory
* Payment processing
* Computer vision
* Automated physical barriers
* Advanced analytics
* Facial recognition
* Full logistics management software

---

# 9. Existing Logistics Applications

This is one of the strongest ideas in the original notes.

If a logistics company already has an application:

```text
Logistics App
      │
      │ API
      ▼
 FastPass
      │
      ▼
Gate Verification
```

FastPass should eventually function as an **access-verification service**, rather than forcing every logistics company to replace its existing software.

### MVP approach

Build the FastPass application first.

Expose the API cleanly enough that an external logistics application could later create access requests.

Do **not** build multiple integrations for the MVP.

---

# 10. API Requirements

Base URL conceptually:

```text
/api/v1
```

## Authentication

```http
POST /auth/login
```

Authenticates an organization/admin user.

---

## Organizations

```http
POST /organizations
GET /organizations/:id
```

Create/retrieve organization information.

---

## Drivers

```http
POST /drivers
GET /drivers/:id
GET /drivers?organizationId=...
```

Register and retrieve drivers.

---

## Gates

```http
POST /gates
GET /gates/:id
GET /gates
```

Create and retrieve registered gates.

---

## Access Requests

```http
POST /access-requests
GET /access-requests/:id
```

Creates/retrieves an access request.

Example:

```json
POST /api/v1/access-requests

{
  "driverId": "drv_104",
  "gateId": "gate_01",
  "purpose": "Package delivery"
}
```

Response:

```json
{
  "id": "req_82F91",
  "status": "PENDING",
  "expiresAt": "2026-08-27T10:00:00Z"
}
```

---

## QR / Verification

```http
POST /verification/scan
```

The gate client submits the scanned request/token.

```json
{
  "requestId": "req_82F91",
  "gateId": "gate_01"
}
```

Response:

```json
{
  "result": "ALLOW",
  "driver": {
    "name": "John Kamau",
    "organization": "ABC Logistics"
  },
  "purpose": "Package delivery"
}
```

Or:

```json
{
  "result": "DENY",
  "reason": "REQUEST_EXPIRED"
}
```

---

## Access Logs

```http
GET /access-logs
GET /access-logs/:id
```

Allows authorized users to review verification activity.

---

# 11. MVP Interfaces

Only **three interfaces** are necessary initially.

### 1. Driver Interface

```text
Login
   ↓
Create access request
   ↓
Display QR
```

### 2. Gate Interface

```text
Scan QR
   ↓
"Verifying..."
   ↓
┌───────────────┐
│    ALLOWED    │
│ John Kamau    │
│ ABC Logistics │
│ Delivery      │
└───────────────┘
```

or:

```text
┌───────────────┐
│     DENIED    │
│ Request       │
│ expired       │
└───────────────┘
```

### 3. Admin Interface

Initially only needs:

* Organizations
* Drivers
* Gates
* Access requests
* Access logs

No fancy dashboard required.

---

# 12. Security Requirements

Even though advanced authentication is not required for the first prototype, security **is** part of the MVP architecture.

### QR tokens should be:

* Random/unpredictable
* Short-lived
* Server-validated
* Single-use where appropriate
* Free of sensitive personal information

### The backend must never trust:

```text
driverId
organizationId
gateId
```

simply because the client supplied them.

The backend must determine whether those relationships are actually valid.

---

# 13. FIDO2 / WebAuthn

FIDO2/WebAuthn should be treated as a **security enhancement to the verification architecture**, not something that blocks the first proof of concept.

### Evolution

**MVP prototype:**

```text
QR → Backend verification → ALLOW/DENY
```

**Production security model:**

```text
QR
 ↓
Challenge
 ↓
Driver/device authentication
 ↓
WebAuthn verification
 ↓
Authorization
 ↓
ALLOW/DENY
```

This allows the team to first prove that the **access workflow itself has value** before spending significant development time on advanced authentication.

---

# 14. Explicitly Out of Scope

The following should **not** enter MVP development unless the first customer proves they are necessary:

* GPS/geofencing
* Computer vision
* Facial recognition
* Route optimization
* AI analytics
* IoT gate hardware
* Automatic barrier control
* Complex multi-tenant permissions
* Native Android/iOS applications
* Microservices
* Kubernetes
* Redis
* Event-driven architecture
* Real-time analytics

A normal backend + database + web clients is sufficient.

---

# 15. MVP Definition of Done

FastPass MVP is considered successful when the team can demonstrate this complete scenario:

```text
1. Organization exists
        ↓
2. Driver is registered
        ↓
3. Gate is registered
        ↓
4. Driver creates an access request
        ↓
5. FastPass generates a QR
        ↓
6. Guard scans QR
        ↓
7. Backend verifies request
        ↓
8. Guard receives ALLOW/DENY
        ↓
9. Verification is recorded
```

### The MVP is NOT complete merely because:

> "The QR scanner works."

The complete **business workflow** must work from request creation through recorded access.

---

# 16. First Technical Architecture

For the initial build, keep the architecture deliberately boring:

```text
             ┌───────────────┐
             │ Driver Web App│
             └───────┬───────┘
                     │
                     ▼
             ┌───────────────┐
             │ Node.js /     │
             │ Express API   │
             └───────┬───────┘
                     │
              ┌──────┴──────┐
              │             │
              ▼             ▼
          MySQL DB      QR Service
              │
              ▼
          Access Logs

             ▲
             │
      ┌──────┴───────┐
      │ Gate Web App │
      │ QR Scanner   │
      └──────────────┘
```

For the first implementation, **a modular monolith is preferable to microservices**.

You want to prove the business, not win an architecture beauty contest.

---

# 17. The Product in One Sentence

> **FastPass lets logistics drivers prove their authorization at a gated location digitally, reducing manual verification time while giving the facility a reliable record of every access attempt.**