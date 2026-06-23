# Object-Oriented Analysis & Design (OOAD)
## Evoria — Event Ticketing Platform

| Field | Value |
|---|---|
| Document | Object-Oriented Analysis & Design |
| Product | Evoria |
| Version | 1.0 |
| Depends On | [Phase 3 — Database Design](phase-3-database-design.md), [Phase 5 — LLD](phase-5-lld.md) |
| Relationship to Phase Sequence | Complements Phase 3 (data shape) and Phase 5 (layer responsibilities) with object-oriented structure — class relationships, behavior, and state — consumed directly by Phase 9 (Implementation) |

---

## 1. Purpose

Phase 3 defined Evoria's data shape (tables, columns, foreign keys). Phase 5 defined layer responsibilities (Controller/Service/Repository, inputs/outputs/dependencies). Neither captured **object behavior** — what operations a domain object exposes, what relationships are compositions versus associations, or how an object's state legally transitions over time. This document fills that gap, in the form code in Phase 9 will directly follow.

---

## 2. Domain Class Diagram

```mermaid
classDiagram
    class User {
        +UUID id
        +Role role
        +string email
        +string passwordHash
        +string name
        +verifyPassword(plain) bool
    }

    class OrganizerProfile {
        +UUID id
        +ApprovalStatus approvalStatus
        +string organizationName
        +approve() void
        +reject(reason) void
    }

    class Event {
        +UUID id
        +string title
        +Category category
        +string description
        +bool published
        +publish() void
        +unpublish() void
        +canPublish() bool
    }

    class Venue {
        +UUID id
        +string name
        +string city
        +int capacity
    }

    class Show {
        +UUID id
        +DateTime dateTime
        +decimal price
        +SeatingType seatingType
        +hasAvailableSeats() bool
    }

    class Seat {
        +UUID id
        +string position
        +SeatStatus status
        +DateTime holdExpiresAt
        +hold(expiry) void
        +release() void
        +confirm() void
        +isHoldExpired() bool
    }

    class Booking {
        +UUID id
        +BookingStatus status
        +decimal priceSnapshot
        +DateTime holdExpiresAt
        +confirm() void
        +cancel() void
        +isExpired() bool
    }

    class Payment {
        +UUID id
        +decimal amount
        +PaymentStatus status
        +string gatewayReference
        +markSuccess(ref) void
        +markFailed() void
    }

    class Ticket {
        +UUID id
        +string referenceId
        +TicketStatus status
        +DateTime validatedAt
        +validate() void
        +isUsed() bool
    }

    class AuditLog {
        +UUID id
        +string actionType
        +string reason
    }

    class Notification {
        +UUID id
        +string type
        +bool readStatus
        +markRead() void
    }

    User "1" --> "0..1" OrganizerProfile : has (if organizer)
    User "1" --> "*" Event : owns (as organizer)
    User "1" --> "*" Booking : makes (as attendee)
    User "1" --> "*" AuditLog : performs (as admin)
    User "1" --> "*" Notification : receives

    Event "1" *-- "*" Show : composed of
    Venue "1" --> "*" Show : hosts
    Show "1" *-- "*" Seat : composed of
    Show "1" --> "*" Booking : booked via

    Booking "1" o-- "*" Seat : claims
    Booking "1" *-- "*" Payment : has attempts
    Booking "1" *-- "*" Ticket : produces
```

### 2.1 Relationship Type Key

| Symbol | Meaning | Example |
|---|---|---|
| `*--` (composition) | Child cannot exist without parent; deleting parent deletes children | `Event *-- Show` — a Show has no meaning without its Event |
| `o--` (aggregation) | Child can exist independently; parent just references it | `Booking o-- Seat` — a Seat exists before and after any one Booking claims it |
| `-->` (association) | A reference relationship, no ownership implication | `User --> Booking` — a User references Bookings they made |

### 2.2 Deliberate Consistency with Phase 3
`User` is **not** subclassed into `Attendee`/`Organizer`/`Admin` here, even though OOP inheritance might seem natural. This stays consistent with the schema decision made in Phase 3, §4.2 — role is a field, not a type hierarchy, with `OrganizerProfile` as the one extension class for organizer-only data. Introducing inheritance here would create a mismatch between the object model and the relational schema it's persisted to.

---

## 3. Service & Repository Class Diagram (Phase 5 → OOP View)

```mermaid
classDiagram
    class BookingController {
        +createBooking(req, res) void
    }
    class BookingService {
        +createBooking(showId, seatIds, userId) Booking
    }
    class SeatRepository {
        +claimSeats(seatIds, tx) ClaimResult
    }
    class BookingRepository {
        +save(booking, tx) Booking
    }
    class HoldExpiryWorker {
        +run() void
    }
    class PaymentWebhookService {
        +handleCallback(payload) void
    }
    class TicketValidationService {
        +validate(ticketId, staffContext) Ticket
    }

    BookingController --> BookingService : delegates to
    BookingService --> SeatRepository : uses
    BookingService --> BookingRepository : uses
    HoldExpiryWorker --> SeatRepository : reuses
    HoldExpiryWorker --> BookingRepository : reuses
    PaymentWebhookService --> BookingRepository : uses
    TicketValidationService --> Ticket : mutates
```

This is the object-oriented expression of Phase 5's module table — the same dependency rules, drawn as class relationships rather than a responsibility table.

---

## 4. State Diagrams

State diagrams capture what Phase 3's `status` enum columns and Phase 5's algorithms only implied — the **legal transitions** between states, and what's explicitly forbidden.

### 4.1 Seat Lifecycle

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE
    AVAILABLE --> HELD : hold() [conditional update succeeds]
    HELD --> BOOKED : confirm() [payment succeeds]
    HELD --> AVAILABLE : release() [hold expires OR booking cancelled]
    BOOKED --> AVAILABLE : release() [booking cancelled]
```

**Illegal transitions (by design):** `AVAILABLE → BOOKED` directly (must pass through `HELD` — this is precisely what `BookingService`'s atomic claim, Phase 5 Module 2, enforces structurally).

### 4.2 Booking Lifecycle

```mermaid
stateDiagram-v2
    [*] --> HELD : BookingService.createBooking()
    HELD --> CONFIRMED : PaymentWebhookService [payment success]
    HELD --> CANCELLED : HoldExpiryWorker [hold expired]
    CONFIRMED --> CANCELLED : cancel() [eligible cancellation]
```

**Illegal transitions:** `CONFIRMED → HELD` (a confirmed Booking can never revert to held — cancellation is the only reverse path, and it terminates rather than reverting).

### 4.3 Ticket Lifecycle

```mermaid
stateDiagram-v2
    [*] --> UNUSED : generated on Booking confirmation
    UNUSED --> USED : validate() [first scan wins]
```

**Illegal transitions:** `USED → UNUSED`. This is intentionally a one-way door — there is no method in the class diagram (§2) that reverses it, mirroring the "first scan wins, no undo" rule from Phase 1, Flow 4.

### 4.4 Organizer Profile Lifecycle

```mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> APPROVED : approve()
    PENDING --> REJECTED : reject()
    APPROVED --> REJECTED : reject() [revocation for cause]
```

**Note:** unlike the other three state machines, `APPROVED → REJECTED` is a legal transition (Phase 4, Endpoint 11 explicitly allows revoking approval after the fact) — unlike Ticket's one-way door, this state machine permits a later re-decision.

---

## 5. Key Use Case Sequence Diagram (Object Interaction View)

The Booking Flow (Phase 1) redrawn at the object/method level, showing exactly which class method is called at each step:

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BC as BookingController
    participant BS as BookingService
    participant SR as SeatRepository
    participant BR as BookingRepository
    participant Seat as Seat (object)
    participant Booking as Booking (object)

    FE->>BC: POST /bookings
    BC->>BS: createBooking(showId, seatIds, userId)
    BS->>SR: claimSeats(seatIds, tx)
    SR->>Seat: hold(expiry) [conditional update]
    Seat-->>SR: updated count
    alt count == requested
        BS->>BR: save(new Booking, tx)
        BR->>Booking: persist [status = HELD]
        BS-->>BC: Booking
        BC-->>FE: 201 Created
    else count < requested
        BS-->>BC: SeatUnavailableError
        BC-->>FE: 409 Conflict
    end
```

---

## 6. Design Principles Applied

| Principle | Where Applied |
|---|---|
| **Single Responsibility** | Each class in §2 owns exactly one entity's data and behavior; each class in §3 owns exactly one layer's responsibility |
| **Encapsulation** | State transitions (§4) only happen through named methods (`hold()`, `confirm()`, `cancel()`) — never by directly setting a status field, keeping illegal transitions structurally harder to reach |
| **Composition over Inheritance** | `Event *-- Show`, `Show *-- Seat` use composition; `User` deliberately avoids subclassing (§2.2), consistent with Phase 3's schema |
| **Dependency Direction** | §3 mirrors Phase 5 exactly — Controller depends on Service, Service depends on Repository, never the reverse |

---

## 7. Out of Scope for This Document

- Full method signatures and parameter types for every class (resolved incrementally during Phase 9 — Implementation)
- Database column-level detail (Phase 3 remains authoritative for schema)
