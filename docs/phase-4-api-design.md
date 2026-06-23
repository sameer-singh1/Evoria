# API Design
## Evoria — Event Ticketing Platform

| Field | Value |
|---|---|
| Document | API Design Specification |
| Product | Evoria |
| Version | 1.0 (v1) |
| Depends On | [Phase 2 — HLD](phase-2-hld.md), [Phase 3 — Database Design](phase-3-database-design.md) |
| Style | REST over HTTPS, JSON request/response bodies |
| Base Path | `/api/v1` |

---

## 1. Purpose

This document specifies Evoria's v1 REST API: every endpoint's method, path, request, response, and error contract. It does not specify internal implementation (locking strategy, transaction boundaries, class design) — that is Phase 5 (Low Level Design).

---

## 2. Conventions

### 2.1 Authentication
All endpoints except `GET /events`, `GET /events/:eventId/shows`, and `GET /shows/:showId/seats` require a `Authorization: Bearer <token>` header. The authenticated identity is always derived from this token — **never** from a request body field.

The webhook endpoint (`POST /webhooks/payment-gateway`) uses a separate authentication mechanism (signature verification) since its caller is an external system, not a user.

### 2.2 Standard Error Envelope

All error responses share this shape:

```json
{
  "error": {
    "code": "SEAT_UNAVAILABLE",
    "message": "One or more selected seats are no longer available.",
    "details": {}
  }
}
```

### 2.3 HTTP Status Code Usage

| Code | Meaning in Evoria's API | Example |
|---|---|---|
| `200 OK` | Successful read, or successful action with no new resource created | Cancel booking |
| `201 Created` | A new resource was created | Create booking, create event |
| `400 Bad Request` | The request is malformed (missing/invalid fields) | Missing `category` enum value |
| `401 Unauthorized` | No valid authentication presented | Missing/expired token |
| `403 Forbidden` | Authenticated, but not allowed to act on this resource | Cancelling another user's booking |
| `404 Not Found` | Resource doesn't exist, **or** intentionally hidden (e.g., unpublished Event) | Unknown event ID |
| `409 Conflict` | Request is valid, but conflicts with current server state | Seat already held, ticket already used |

### 2.4 Idempotency Principle
Action endpoints that represent a state transition (`cancel`, `publish`, the payment webhook) treat re-invocation on an already-completed transition as a **successful no-op**, not an error — protecting against retries, double-clicks, and at-least-once delivery semantics.

---

## 3. Endpoint Index

| # | Method | Path | Auth | Implements |
|---|---|---|---|---|
| 1 | GET | `/events` | None | FR-1 |
| 2 | GET | `/events/:eventId/shows` | None | FR-1 |
| 3 | GET | `/shows/:showId/seats` | None | FR-2 |
| 4 | POST | `/bookings` | Attendee | FR-2, NFR-1 |
| 5 | POST | `/bookings/:bookingId/payments` | Attendee | FR-3 |
| 6 | POST | `/webhooks/payment-gateway` | Signature | FR-3 |
| 7 | POST | `/bookings/:bookingId/cancel` | Attendee | FR-6 |
| 8 | POST | `/events` | Organizer | FR-5 |
| 9 | PATCH | `/events/:eventId/publish` | Organizer | FR-5 |
| 10 | POST | `/tickets/:ticketId/validate` | Venue Staff | FR-4 |
| 11 | PATCH | `/organizers/:organizerId/approval` | Admin | FR-8 |

---

## 4. Endpoint Specifications

### 4.1 `GET /events`

**Description:** Browse/search the published Event catalog. Implements Discovery (FR-1).

**Query Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `category` | enum | No | One of `MOVIE`, `CONCERT`, `SPORT`, `WORKSHOP`, `COMEDY`, `FESTIVAL` |
| `city` | string | No | Filters to Shows in this city |
| `search` | string | No | Free-text match on title |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "evt_8f3a...",
      "title": "Coldplay: Music of the Spheres",
      "category": "CONCERT",
      "mediaUrl": "https://cdn.evoria.com/events/evt_8f3a/banner.jpg",
      "organizerName": "Live Nation India"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 47 }
}
```
An empty `data` array is a valid, successful response — not an error.

**Errors:** `400 Bad Request` if `category` is not a recognized enum value.

---

### 4.2 `GET /events/:eventId/shows`

**Description:** List bookable Shows under a specific Event. Implements Booking Flow step 2.

**Path Parameters:** `eventId` (UUID)

**Query Parameters:** `date` (optional, ISO date), `city` (optional)

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "show_1c2d...",
      "dateTime": "2026-08-14T19:00:00Z",
      "venue": { "name": "DY Patil Stadium", "city": "Mumbai" },
      "price": 4999.00,
      "seatingType": "SEATED"
    }
  ]
}
```

**Errors:**
- `404 Not Found` — `eventId` doesn't exist, **or** the Event is unpublished (identical response in both cases, to avoid leaking the existence of unpublished Events)

---

### 4.3 `GET /shows/:showId/seats`

**Description:** Return the seat map (or quantity availability) for a Show.

**Path Parameters:** `showId` (UUID)

**Response `200 OK` — Seated show:**
```json
{
  "seatingType": "SEATED",
  "seats": [
    { "id": "seat_aa11...", "position": "A1", "status": "AVAILABLE" },
    { "id": "seat_aa12...", "position": "A2", "status": "HELD" }
  ]
}
```

**Response `200 OK` — General admission show:**
```json
{
  "seatingType": "GENERAL_ADMISSION",
  "availableQuantity": 312
}
```

**Errors:** `404 Not Found` — unknown or unpublished `showId`.

---

### 4.4 `POST /bookings`

**Description:** Place an atomic, temporary hold on seats (or quantity) for a Show. **The single most consistency-critical endpoint in the system** (NFR-1).

**Auth:** Required (Attendee). Identity derived from token.

**Request Body:**
```json
{
  "showId": "show_1c2d...",
  "seatIds": ["seat_aa11...", "seat_aa13..."]
}
```
For `GENERAL_ADMISSION` Shows, `quantity` replaces `seatIds`.

**Response `201 Created`:**
```json
{
  "id": "bkg_55ee...",
  "status": "HELD",
  "showId": "show_1c2d...",
  "seats": ["seat_aa11...", "seat_aa13..."],
  "holdExpiresAt": "2026-06-22T10:15:00Z"
}
```

**Errors:**
- `409 Conflict` — one or more requested seats are no longer available. **All-or-nothing**: if any requested seat is unavailable, the entire request fails — no partial holds are ever created
- `404 Not Found` — `showId` doesn't exist or its Event is unpublished
- `401 Unauthorized` — no valid authentication

---

### 4.5 `POST /bookings/:bookingId/payments`

**Description:** Initiate a payment attempt against a held Booking; hands off to the Payment Gateway.

**Auth:** Required (Attendee, must own the Booking).

**Path Parameters:** `bookingId` (UUID)

**Request Body:**
```json
{ "paymentMethod": "CARD" }
```

**Response `201 Created`:**
```json
{
  "paymentId": "pay_77ff...",
  "status": "PENDING",
  "redirectUrl": "https://gateway.example.com/checkout/sess_abc123"
}
```
This response never includes raw payment details — Evoria hands off to the gateway entirely.

**Errors:**
- `404 Not Found` — `bookingId` doesn't exist
- `403 Forbidden` — `bookingId` belongs to a different user (booking IDs are not publicly enumerable, so `403` is appropriate here, unlike the `404` pattern used for unpublished Events)
- `409 Conflict` — the Booking's seat hold has already expired

---

### 4.6 `POST /webhooks/payment-gateway`

**Description:** Server-to-server callback from the Payment Gateway reporting final payment status. **The only endpoint called by an external system, not a user** — represents the System actor (PRD, Section 4).

**Auth:** Verified via a signature header (e.g., `X-Gateway-Signature`), not a user bearer token.

**Request Body (gateway-defined shape, illustrative):**
```json
{
  "gatewayReference": "txn_99a8...",
  "status": "SUCCESS",
  "amount": 9998.00
}
```

**Response `200 OK`:** Empty/acknowledgment body. Triggers, internally: Payment → `SUCCESS`, Booking `HELD` → `CONFIRMED`, Ticket generation, Notification dispatch.

**Errors:**
- `401 Unauthorized` — missing or invalid signature
- `404 Not Found` — `gatewayReference` doesn't match any known Payment

**Critical behavior — Idempotency:** if this webhook is delivered more than once for the same `gatewayReference` (gateways deliver "at least once"), the second and subsequent calls must return `200 OK` and perform **no further action** — never re-confirm a Booking or regenerate a Ticket.

---

### 4.7 `POST /bookings/:bookingId/cancel`

**Description:** Cancel a confirmed Booking. Uses `POST`, not `DELETE` — cancellation is a state transition that preserves the record for history/audit, not a removal.

**Auth:** Required (Attendee, must own the Booking).

**Path Parameters:** `bookingId` (UUID)

**Response `200 OK`:**
```json
{ "id": "bkg_55ee...", "status": "CANCELLED" }
```

**Errors:**
- `404 Not Found` — unknown booking
- `403 Forbidden` — not the owning user
- `409 Conflict` — past the cancellation cutoff policy

**Idempotency:** calling this on an already-cancelled Booking returns `200 OK` with the current state — not an error.

---

### 4.8 `POST /events`

**Description:** Organizer creates a new Event (draft, unpublished by default).

**Auth:** Required (Organizer, must have `approvalStatus = APPROVED`).

**Request Body:**
```json
{
  "title": "Coldplay: Music of the Spheres",
  "category": "CONCERT",
  "description": "...",
  "mediaRef": "s3://evoria-media/uploads/abc123.jpg"
}
```

**Response `201 Created`:**
```json
{ "id": "evt_8f3a...", "published": false }
```

**Errors:**
- `403 Forbidden` — caller is not an approved Organizer (enforced against `OrganizerProfile.approvalStatus`)
- `400 Bad Request` — missing required fields
- `401 Unauthorized` — no valid authentication

---

### 4.9 `PATCH /events/:eventId/publish`

**Description:** Publish an Event, making it and its Shows visible in Discovery. A dedicated action route (not a generic field `PATCH`) because publishing cascades into visibility consequences for every Show under the Event.

**Auth:** Required (Organizer, must own the Event).

**Path Parameters:** `eventId` (UUID)

**Response `200 OK`:**
```json
{ "id": "evt_8f3a...", "published": true }
```

**Errors:**
- `404 Not Found` — unknown event
- `403 Forbidden` — not the owning Organizer
- `409 Conflict` — Event has zero Shows

**Idempotency:** already-published returns `200 OK`, not an error.

---

### 4.10 `POST /tickets/:ticketId/validate`

**Description:** Venue-staff scan of a Ticket for entry. Structurally identical to `POST /bookings` — an atomic, exactly-once claim under concurrency.

**Auth:** Required (Venue Staff, authorized for this Ticket's Show/Organizer).

**Path Parameters:** `ticketId` — the `reference_id` encoded in the QR code

**Response `200 OK`:**
```json
{ "status": "USED", "seat": "A12", "attendeeName": "J. Doe" }
```

**Errors:**
- `404 Not Found` — unknown ticket reference
- `409 Conflict` — ticket already used (response includes the original `validatedAt` timestamp to support fraud investigation)
- `403 Forbidden` — staff not authorized for this Show

---

### 4.11 `PATCH /organizers/:organizerId/approval`

**Description:** Admin approves or rejects an Organizer. Fans out into an Audit Log entry, a Notification, and unblocks/blocks `POST /events`.

**Auth:** Required (Admin).

**Path Parameters:** `organizerId` (UUID)

**Request Body:**
```json
{ "decision": "APPROVED", "reason": "Verified business registration." }
```

**Response `200 OK`:**
```json
{ "organizerId": "org_22bb...", "approvalStatus": "APPROVED" }
```

**Errors:**
- `404 Not Found` — unknown organizer
- `403 Forbidden` — caller is not an Admin
- `400 Bad Request` — invalid/missing `decision`

**Note:** re-deciding an already-approved Organizer (e.g., revoking approval for cause) is intentionally **allowed**, not rejected as a duplicate — unlike the idempotent actions above, this is a legitimate re-decision, not a retry.

---

## 5. Cross-Cutting Design Patterns

| Pattern | Applies To | Rationale |
|---|---|---|
| Identity from auth token only | 4, 5, 8, 11 | Prevents acting on another user's behalf |
| `409` for valid-but-conflicting state | 4, 5, 7, 10 | Distinguishes from `400` (malformed request) |
| Exactly-once-under-concurrency | 4, 10 | Same structural problem (seat hold, ticket scan) solved identically |
| Idempotent action endpoints | 6, 7, 9 | Safe against retries/double-clicks/at-least-once delivery |
| Dedicated action routes over generic PATCH | 7, 9 | Used when the change cascades beyond the literal field |
| `404` vs `403` for access control | 2 (`404`), 5 (`403`) | Depends on whether confirming existence itself leaks information |

---

## 6. Out of Scope for This Document

- Locking/transaction implementation for the seat-hold and ticket-validation endpoints (Phase 5)
- Signature verification algorithm for the payment webhook (Phase 5 / Phase 6 — Security Design)
- Rate limiting and request throttling specifics (Phase 7 — Scalability Design)
