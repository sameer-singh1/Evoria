# Evoria

A production-grade event ticketing platform — think BookMyShow or District. Attendees discover and book tickets for concerts, movies, sports, comedy shows, workshops, and festivals. Organizers create and manage events. Admins moderate the platform.

## Tech Stack

**Backend:** Node.js, Express, TypeScript  
**Database:** MySQL (via Docker), Prisma ORM  
**Auth:** JWT (access token) + bcrypt  

**Frontend (planned):** React, TypeScript, Vite, TanStack Query, Zustand  
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

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Health check |
| POST | `/auth/register` | None | Register a new user |
| POST | `/auth/login` | None | Login and receive JWT |
| GET | `/events` | None | List all published events |
| POST | `/events` | Bearer token (Organizer) | Create a new event |
| GET | `/events/:eventId/shows` | None | List shows for an event |
| POST | `/events/:eventId/shows` | Bearer token (Organizer) | Create a show with seats |
| GET | `/shows/:showId/seats` | None | List all seats for a show |
| POST | `/bookings` | Bearer token (Attendee) | Hold seats and create a booking |
| POST | `/webhooks/payment` | HMAC signature | Confirm payment and finalize booking |

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
│   │   └── migrations/         # Migration history
│   └── src/
│       ├── features/
│       │   ├── auth/           # Register + Login
│       │   ├── event/          # Event CRUD
│       │   ├── show/           # Show + Seat creation
│       │   ├── organizer/      # Organizer profile
│       │   └── booking/        # Booking, seat hold, payment webhook
│       └── shared/
│           ├── database/       # Prisma client connection
│           └── middleware/     # JWT authentication
├── docs/                       # Architecture and design docs
└── .vscode/
    └── launch.json             # Debugger config
```
