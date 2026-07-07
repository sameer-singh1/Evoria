# Repository Structure
## Evoria — Event Ticketing Platform

| Field | Value |
|---|---|
| Document | Repository Structure |
| Product | Evoria |
| Version | 1.0 |
| Depends On | [Phase 3 — Database Design](phase-3-database-design.md), [Phase 5 — LLD](phase-5-lld.md), [Phase 6 — Security Design](phase-6-security-design.md) |

---

## 1. Purpose

This document defines where Evoria's code physically lives — repository topology, and the internal folder structure of both Backend and Frontend. Every structural decision here traces back to an architectural decision made in an earlier phase; none are arbitrary convention.

---

## 2. Repository Topology: Monorepo

**Decision:** A single Git repository contains both Frontend and Backend.

**Justification:**
- **KISS** — simpler to clone, run, and reason about at the current project scale
- **Coordinated changes** — an API contract change (Phase 4) and its Frontend consumer can be made and reviewed in one commit/PR
- Appropriate for the current team/organizational scale; a future split along team boundaries remains possible if scale changes

---

## 3. Full Repository Tree

```
evoria/
├── backend/
│   └── src/
│       ├── features/
│       │   ├── booking/
│       │   │   ├── booking.controller.ts
│       │   │   ├── booking.service.ts
│       │   │   ├── booking.repository.ts
│       │   │   └── holdExpiryWorker.ts
│       │   ├── event/
│       │   │   ├── event.controller.ts
│       │   │   ├── event.service.ts
│       │   │   └── event.repository.ts
│       │   ├── show/
│       │   │   ├── show.controller.ts
│       │   │   ├── show.service.ts
│       │   │   └── show.repository.ts
│       │   ├── seat/
│       │   │   └── seat.repository.ts
│       │   ├── venue/
│       │   │   └── venue.repository.ts
│       │   ├── payment/
│       │   │   ├── payment.controller.ts
│       │   │   ├── payment.service.ts
│       │   │   └── payment.repository.ts
│       │   ├── ticket/
│       │   │   ├── ticket.controller.ts
│       │   │   ├── ticket.service.ts
│       │   │   └── ticket.repository.ts
│       │   ├── organizer/
│       │   │   ├── organizer.controller.ts
│       │   │   ├── organizer.service.ts
│       │   │   └── organizer.repository.ts
│       │   ├── admin/
│       │   │   ├── admin.controller.ts
│       │   │   └── auditLog.repository.ts
│       │   ├── notification/
│       │   │   ├── notification.repository.ts
│       │   │   └── notificationConsumer.ts
│       │   └── user/
│       │       └── user.repository.ts
│       └── shared/
│           ├── middleware/
│           │   ├── authenticate.ts
│           │   ├── authorize.ts
│           │   └── verifyWebhookSignature.ts
│           ├── database/
│           │   └── connection.ts
│           └── types/
├── frontend/
│   └── src/
│       ├── features/
│       │   ├── auth/
│       │   │   ├── pages/
│       │   │   └── hooks/
│       │   ├── booking/
│       │   │   ├── components/
│       │   │   ├── pages/
│       │   │   └── hooks/
│       │   ├── event/
│       │   │   ├── components/
│       │   │   ├── pages/
│       │   │   └── hooks/
│       │   └── organizer/
│       │       ├── components/
│       │       ├── pages/
│       │       └── hooks/
│       ├── shared/
│       │   ├── components/
│       │   ├── store/
│       │   └── hooks/
│       └── lib/
│           └── api.ts
└── docs/
```

---

## 4. Backend: Feature-Based Organization

### 4.1 Rule
Code is grouped by **domain feature** (Booking, Event, Seat, Payment, Ticket...), not by technical layer (`/controllers`, `/services`, `/repositories`). Each feature folder contains its own Controller, Service, and Repository as needed (Phase 5, §2).

### 4.2 Rationale
As the entity count grows (11 entities, Phase 3), a layer-based structure causes each layer folder to grow unboundedly and unrelated to feature boundaries — finding "everything related to Booking" would require searching three separate folders. Feature-based grouping keeps domain cohesion intact and supports a future microservice extraction if ever needed, since each folder is already largely self-contained.

### 4.3 Cross-Feature Dependencies
Folder boundaries reflect **ownership**, not **usage restriction**. `booking.service.ts` imports `seat.repository.ts` from the `seat/` folder — Seat owns its Repository, Booking is permitted to depend on it, exactly as designed in Phase 5, Module 2.

### 4.4 Placement of Non-HTTP Modules
`HoldExpiryWorker` (Phase 5, Module 5) is a scheduled job, not an HTTP handler, but its logic is genuinely Booking-domain logic — it is placed inside `features/booking/`, not `shared/`. The test applied: does this code belong to one feature with an unusual trigger, or is it truly used by multiple unrelated features?

---

## 5. Backend: `shared/` — Cross-Cutting Code

### 5.1 Contents

| File | Purpose | Traces To |
|---|---|---|
| `middleware/authenticate.ts` | JWT verification | Phase 6, §3 |
| `middleware/authorize.ts` | Role-based access check | Phase 6, §4 |
| `middleware/verifyWebhookSignature.ts` | HMAC signature verification | Phase 6, §5 |
| `database/connection.ts` | Shared database client/pool | Phase 2, Component 3.3 |

### 5.2 Discipline
A file belongs in `shared/` only if it is genuinely used by **multiple unrelated features** — not merely "infrastructure-flavored." An unchecked `shared/` folder is a known anti-pattern where ambiguous code accumulates indefinitely.

---

## 6. Frontend: Feature-Based Organization

### 6.1 Per-Feature Structure
Each feature folder contains:

| Subfolder | Purpose |
|---|---|
| `components/` | Presentational UI pieces specific to this feature |
| `pages/` | Route-level components (React Router) |
| `hooks/` | TanStack Query hooks — **server state** |

Revised 2026-07-02: Zustand `store/` slices are no longer nested per-feature. In
practice most client-only state (starting with auth session state) is cross-cutting
enough to want one predictable location — see 6.3.

### 6.2 Server State vs. Client State

| | TanStack Query (`hooks/`) | Zustand (`shared/store/`) |
|---|---|---|
| **Manages** | Data that lives on the Backend (Shows, seat availability) | Data that exists only in the browser (auth session, currently-selected seats before submission) |
| **Needs** | Fetching, caching, invalidation, refetch-on-stale | Simple, synchronous local state |
| **Risk if conflated** | Manually reimplementing caching/staleness logic Query already solves | Server data duplicated across two sources, drifting out of sync |

### 6.3 `shared/` and `lib/` (Frontend)

| Folder | Purpose |
|---|---|
| `shared/components/` | Generic, feature-agnostic UI primitives (Button, Modal) |
| `shared/store/` | Zustand slices — **client-only state**, one flat location rather than duplicated per-feature (e.g. `authStore.ts`) |
| `shared/hooks/` | Cross-feature reusable hooks |
| `lib/api.ts` | The HTTP client (axios) — attaches the JWT Access Token (Phase 6, §3) to every request via an interceptor reading `shared/store/authStore` |

`lib/` is kept separate from `shared/` for infrastructure/client wrappers (the API
client, and future third-party SDK wrappers) as opposed to `shared/`, which holds
reusable application code (components, hooks, state).

---

## 7. Structural Traceability Summary

| Structural Decision | Traces Back To |
|---|---|
| Monorepo | KISS; coordinated API + Frontend changes (Phase 4) |
| Backend feature folders | Feature-Based Architecture principle; 11 entities (Phase 3) |
| `shared/` cross-cutting code | Authentication/Authorization middleware (Phase 6) |
| Frontend `hooks/` vs `store/` split | Server state vs. client state distinction (tech stack: TanStack Query, Zustand) |

---

## 8. Out of Scope for This Document

- Build tooling configuration (Vite config, TypeScript config) — Phase 9, Implementation
- CI/CD pipeline structure — Phase 11, Deployment
