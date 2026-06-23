# Product Requirement Document (PRD)
## Evoria — Event Ticketing Platform

| Field | Value |
|---|---|
| Document | Product Requirement Document |
| Product | Evoria |
| Version | 1.0 (v1 scope) |
| Status | Approved for downstream design (Phases 1–4) |
| Owner | Product / Engineering |

---

## 1. Purpose of This Document

This PRD defines **what** Evoria must do and **why**, before any technical design begins. It is the single source of truth that every later design artifact — business flows, architecture, database schema, and API contracts — must trace back to. No requirement in a later phase should exist that cannot be justified by something written here.

---

## 2. Background & Problem Statement

Before platforms like Evoria existed, attending an event meant physically visiting a venue or calling a box office to buy a ticket. This created friction for attendees (limited reach, no comparison, no convenience) and a hard ceiling on scale for organizers (no way to sell beyond their physical box office). Evoria removes that friction by acting as a digital marketplace between the two sides.

---

## 3. Core Business Objective

Evoria is a **marketplace connecting Attendees (people who want to attend events) with Organizers (people who host events)**, removing the friction of discovery, purchase, and ticket delivery.

| Stakeholder | Value Delivered |
|---|---|
| Attendee | Find, compare, and book any event from anywhere, with a trustworthy guarantee of entry |
| Organizer | Sell tickets at scale without building or operating their own payment/booking infrastructure |
| Evoria (the business) | Revenue via convenience fees and commissions on every completed transaction |

**Guiding principle:** every requirement, architecture decision, and design trade-off in this project must trace back to making the Attendee–Organizer transaction easier, safer, or faster. A feature that cannot be justified against this principle does not belong in v1.

---

## 4. Actors

| Actor | Definition | Authenticated? |
|---|---|---|
| **Guest** | Anyone browsing the platform without an account. Can view events but cannot book. | No |
| **Attendee** | A registered user who discovers, books, manages, and attends events. | Yes |
| **Organizer** | A registered, platform-approved entity that creates and manages Events, Shows, and pricing, and monitors sales. | Yes |
| **Admin** | Internal Evoria staff who moderate content, approve organizers, resolve disputes, and oversee the platform. | Yes |
| **System** | The non-human actor representing automated processes — payment gateway callbacks, notification dispatch, seat-hold expiry jobs. | N/A (machine-to-machine) |

---

## 5. Functional Requirements

Each requirement below is numbered (`FR-n`) so it can be referenced unambiguously by later design phases.

### FR-1 — Event Discovery
**Description:** Attendees and Guests must be able to browse events by category (Movies, Concerts, Sports, Workshops, Stand-up Comedy, Festivals), search by name/city/date, and view full event details before booking.

**Acceptance Criteria:**
- A user can filter the event catalog by at least: category, city, date range, free-text search
- Event detail view shows description, organizer, category, media, and available Shows
- This is the entry point of the platform — no other requirement is reachable without it succeeding first

---

### FR-2 — Booking (Seat/Quantity Hold)
**Description:** An Attendee selects a Show, selects seats (or a quantity for non-seated events), and receives a **temporary hold** on that inventory while completing payment. The booking is confirmed only after payment succeeds.

**Acceptance Criteria:**
- Two Attendees can never successfully hold or book the same seat at the same time
- A hold has a defined expiry; if payment is not completed in time, the hold is released automatically
- Booking status must always be one of: held, confirmed, cancelled — no undefined intermediate states

**Core challenge:** safely allocating a limited, shared resource (seats) under concurrent demand. This is the platform's single most consistency-critical requirement.

---

### FR-3 — Payment
**Description:** Evoria delegates all money handling to a third-party Payment Gateway. Evoria itself never stores or transmits raw card/bank details.

**Acceptance Criteria:**
- A Booking is confirmed if and only if payment is confirmed successful by the gateway
- Payment failure or timeout automatically releases the associated seat hold (see FR-2)
- Payment status must be verified server-to-server — a client-reported "success" is never trusted on its own

---

### FR-4 — Ticket Generation & Delivery
**Description:** After payment success, the system generates a unique, scannable ticket (QR code) per seat (or per unit, for non-seated events) and delivers it to the Attendee in-app and/or via email.

**Acceptance Criteria:**
- Each ticket maps to exactly one seat/unit of one confirmed Booking
- The QR code encodes only a reference ID — it is never the source of truth for validity
- A ticket can be validated (used) exactly once; a second scan must be rejected

---

### FR-5 — Event & Show Management
**Description:** Organizers create **Events** (the abstract offering) and one or more **Shows** under each Event (a specific date/time/venue occurrence), define seat layout/capacity and pricing per Show, and control visibility via publish/unpublish.

**Acceptance Criteria:**
- An Event can have zero or more Shows; a Show belongs to exactly one Event
- An Event must not be publishable while it has zero Shows
- Unpublished Events/Shows must not appear in Discovery (FR-1) for Attendees or Guests

**Design note:** Event ≠ Show. Event is the static, descriptive concept; Show is the bookable, occurrence-specific instance. This distinction is foundational and carries through every later phase.

---

### FR-6 — Cancellation & Refunds
**Description:** An Attendee may cancel a confirmed Booking if it is eligible per a defined cutoff policy. On eligible cancellation, the held seats are released back to inventory and a refund is triggered through the Payment Gateway.

**Acceptance Criteria:**
- Cancellation eligibility is policy-driven (e.g., a cutoff time before the Show), not hardcoded
- Seat inventory is released immediately on cancellation, independent of refund completion timing
- A refund failure must result in a trackable, visible state — never a silent failure

---

### FR-7 — Notifications
**Description:** The system automatically notifies Attendees of booking confirmation, payment failure, cancellation/refund, and upcoming show reminders.

**Acceptance Criteria:**
- Notification dispatch must never block or delay the action that triggered it (e.g., booking confirmation must not wait on email delivery)
- Notifications are reactive — triggered by the completion of other requirements (FR-2, FR-3, FR-6), not standalone user actions

---

### FR-8 — Admin & Moderation
**Description:** Admins approve or reject newly registered Organizers, take down Events/Shows for fraud or policy violations, resolve Attendee-reported disputes, and have platform-wide visibility for oversight.

**Acceptance Criteria:**
- An Organizer cannot create or publish Events until approved by an Admin
- Every Admin action (approval, takedown, dispute resolution) must be permanently and immutably logged, including who performed it and why
- Event takedown must trigger the same cancellation/refund handling as a normal Attendee-initiated cancellation (FR-6) for every affected Booking

---

## 6. Non-Functional Requirements

Each NFR below is numbered (`NFR-n`) for traceability.

### NFR-1 — Consistency
Seat allocation (FR-2) must be **strongly consistent**: a seat must never be successfully claimed by two concurrent Bookings, under any load condition. This requirement is non-negotiable and takes priority over availability or latency where the two conflict (see NFR-3).

### NFR-2 — Scalability
The platform must independently scale for two distinct traffic shapes:
- **Read scalability** — Discovery (FR-1) is high-traffic and read-heavy; it must remain fast under load without burdening the system of record
- **Write-contention scalability** — Booking (FR-2) must handle sudden, concentrated demand spikes ("flash sales") for a single popular Show without violating NFR-1

### NFR-3 — Availability
Availability requirements are **not uniform** across the platform:
- Discovery (FR-1) should favor remaining available even when serving slightly stale data
- Booking (FR-2) should favor correctness over availability — rejecting a request is preferable to risking a double-booking
- Payment (FR-3) prioritizes **reliability** (never losing track of true payment state) over raw uptime

### NFR-4 — Security
- **Authentication** (proving who a user is) and **Authorization** (deciding what they may do) are distinct concerns and must both be enforced on every actor-driven requirement
- Sensitive data (passwords, payment details) must never be stored or transmitted in plain, reversible form
- The platform must defend specifically against broken authorization (e.g., one user acting on another's resources), historically the most common real-world failure class

---

## 7. Scope

### 7.1 In Scope (v1)
Everything described in FR-1 through FR-8 and NFR-1 through NFR-4.

### 7.2 Out of Scope (v1)

| Item | Reason for Deferral |
|---|---|
| Dynamic/surge pricing | Not required to prove the core transaction; adds significant pricing-engine complexity |
| Peer-to-peer ticket resale | Introduces fraud/trust problems outside v1's risk appetite |
| Multi-currency / international payments | Single currency, single region assumed for v1 |
| Recommendation engine | An ML/personalization layer, not core to the transaction |
| Native mobile apps | Web only for v1 |

These items are **deferred, not rejected** — each may become a future requirement once the core platform proves the business objective in Section 3.

---

## 8. Success Metrics (KPIs)

| Metric | Definition | Maps To |
|---|---|---|
| **Booking conversion rate** | % of Event/Show viewers who complete a Booking | FR-1, FR-2 |
| **Booking success rate** | % of Booking attempts that complete without failure | FR-2, FR-3, NFR-1 |
| **Time to book** | Elapsed time from Show selection to confirmed ticket | FR-2, FR-3, FR-4 |
| **Organizer retention** | % of Organizers who list more than one Event | FR-5 |

Every metric maps to a specific requirement above — metrics validate what was designed, they do not introduce new goals.

---

## 9. Assumptions & Constraints

- Single currency and single geographic region for v1 (see Section 7.2)
- Evoria does not process or store raw payment instrument data under any circumstance (FR-3, NFR-4)
- All Organizer accounts require Admin approval before any Event can be published (FR-8)

---

## 10. Glossary

| Term | Definition |
|---|---|
| **Event** | The abstract offering an Organizer promotes (e.g., a comedy tour), independent of date/venue |
| **Show** | A specific, bookable occurrence of an Event — a fixed date, time, and venue |
| **Hold** | A temporary, time-limited claim on seats/inventory during checkout, before payment is confirmed |
| **Booking** | The record of an Attendee's reservation, in state held, confirmed, or cancelled |
| **Ticket** | The proof-of-booking artifact (QR-coded) issued per seat/unit after payment success |
