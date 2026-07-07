# Evoria

A production-grade event ticketing platform — think BookMyShow or District. Attendees discover and book tickets for concerts, movies, sports, comedy shows, workshops, and festivals. Organizers create and manage events. Admins moderate the platform.

## Tech Stack

**Backend:** Node.js, Express, TypeScript  
**Database:** MySQL (via Docker), Prisma ORM  
**Auth:** JWT (access token) + bcrypt  

**Frontend:** React 19, TypeScript, Vite, React Router, TanStack Query (server state), Zustand (client state), Tailwind CSS v4  
**Infrastructure (planned):** Redis, RabbitMQ, AWS S3, Docker, Kubernetes, AWS

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/sameer-singh1/Evoria.git
cd Evoria
```

### 2. Start the MySQL container

```bash
docker run --name evoria-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=evoria \
  -p 3307:3306 \
  -d mysql:8
```

> If the container already exists, start it with: `docker start evoria-mysql`

### 3. Install dependencies

```bash
cd backend
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `backend/` folder:

```env
DATABASE_URL="mysql://root:root@localhost:3307/evoria"
JWT_SECRET="your-secret-key"
PAYMENT_WEBHOOK_SECRET="your-webhook-secret"
```

### 5. Run database migrations

```bash
npx prisma migrate dev
```

### 6. Generate Prisma client

```bash
npx prisma generate
```

### 7. Build and run

```bash
npm run build
node dist/index.js
```

The server starts on `http://localhost:3000`.

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Run the dev server

```bash
npm run dev
```

The app starts on `http://localhost:5173`. The backend must already be running on `http://localhost:3000` — the backend's CORS config only allows requests from this exact origin.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Health check |
| POST | `/auth/register` | None | Register a new user |
| POST | `/auth/login` | None | Login and receive JWT |
| GET | `/events` | None | List all published events |
| GET | `/events/:eventId` | None | Get a single published event's details |
| POST | `/events` | Bearer token (Organizer) | Create a new event |
| GET | `/events/:eventId/shows` | None | List shows for an event (with venue + starting price) |
| POST | `/events/:eventId/shows` | Bearer token (Organizer) | Create a show with seats |
| GET | `/shows/:showId/seats` | None | List all seats for a show |
| POST | `/organizer/apply` | Bearer token | Apply for organizer approval |
| POST | `/bookings` | Bearer token (Attendee) | Hold seats and create a booking |
| GET | `/bookings/:id` | Bearer token (Owner) | Get booking details with seats and tickets |
| POST | `/webhooks/payment` | HMAC signature | Confirm payment and finalize booking |

## Frontend Pages

| Route | Page | Status |
|-------|------|--------|
| `/login` | Login | Built |
| `/register` | Register | Built |
| `/` | Browse events | Built |
| `/events/:eventId` | Event detail — pick a show | Built |
| `/events/:eventId/shows/:showId/seats` | Seat selection | Built |
| `/bookings/:id` | Booking confirmation | Built |
| — | Apply to become an organizer | Stub component only, not routed |
| — | Create event | Stub component only, not routed |
| — | Create show | Stub component only, not routed |

## Testing the Payment Flow

Since there is no real payment gateway integrated yet, the webhook must be called manually with a computed HMAC signature.

### Step 1 — Register and login as an attendee

```
POST /auth/register
{ "email": "attendee@example.com", "password": "Test1234", "name": "Test User", "role": "ATTENDEE" }
```

```
POST /auth/login
{ "email": "attendee@example.com", "password": "Test1234" }
```

Copy the `token` from the response.

### Step 2 — Browse and pick seats

```
GET /events
GET /events/:eventId/shows
GET /shows/:showId/seats
```

Copy the `id` values of the seats you want to book.

### Step 3 — Create a booking

```
POST /bookings
Authorization: Bearer <token>
{ "showId": "<showId>", "seatIds": ["<seatId1>", "<seatId2>"] }
```

Copy the `id` from the response — this is your `bookingId`. Seats are now HELD for 10 minutes.

### Step 4 — Compute the webhook signature

Run this in the `backend/` folder, replacing the `bookingId` and body with the exact JSON you will send:

```bash
node -e "
const c = require('crypto');
const body = '{\"bookingId\":\"<your-bookingId>\"}';
console.log(c.createHmac('sha256', '<your-PAYMENT_WEBHOOK_SECRET>').update(body).digest('hex'));
"
```

> The body string used here must match **exactly** what you send in the request — same whitespace, same formatting.

### Step 5 — Call the webhook

```
POST /webhooks/payment
Content-Type: application/json
x-webhook-signature: <hex from step 4>

{"bookingId": "<your-bookingId>"}
```

Response: `{ "received": true }`

The booking status changes to `CONFIRMED` and seats change to `BOOKED`.

## Development Tools

**Prisma Studio** — visual database browser:

```bash
cd backend
npx prisma studio
```

Opens at `http://localhost:5555`.

**VS Code Debugger** — a `launch.json` is included. Press `F5` in VS Code to start the backend with full debugging support (breakpoints, variable inspection, call stack).

## Project Structure

```
Evoria/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database models
│   │   ├── migrations/         # Migration history
│   │   └── seed.js             # Sample data (venues, events, shows, seats)
│   └── src/
│       ├── features/
│       │   ├── auth/           # Register + Login
│       │   ├── event/          # Event CRUD
│       │   ├── show/           # Show + Seat creation
│       │   ├── organizer/      # Organizer profile
│       │   └── booking/        # Booking, seat hold, ticket issuance, payment webhook
│       └── shared/
│           ├── database/       # Prisma client connection
│           └── middleware/     # JWT authentication
├── frontend/
│   └── src/
│       ├── features/
│       │   ├── auth/           # Login, Register (pages + hooks)
│       │   ├── event/          # Browse events, event detail (pages + hooks)
│       │   ├── show/           # Seat selection (page + hook)
│       │   ├── booking/        # Booking confirmation (page + hooks)
│       │   └── organizer/      # Organizer pages (stubs, not yet wired)
│       ├── shared/
│       │   └── store/          # Zustand stores (auth session)
│       └── lib/
│           └── api.ts          # Shared fetch wrapper (base URL, auth header, error handling)
├── docs/                       # Architecture and design docs
└── .vscode/
    └── launch.json             # Debugger config
```

## Known Limitations

- **No token refresh.** JWTs expire after 15 minutes with no renewal mechanism — an expired session fails with `401 Invalid or expired token` on the next protected request, requiring a manual re-login.
- **No automatic seat-hold expiry.** A `HELD` seat's `holdExpiresAt` is stored but nothing currently sweeps expired holds back to `AVAILABLE`.
- **Organizer-side pages aren't built.** Applying as an organizer, creating events, and creating shows all have working backend endpoints but only stub frontend components with no routes.
- **No real payment gateway.** See "Testing the Payment Flow" above — the webhook must be triggered manually.
