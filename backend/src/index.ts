import express from "express";
import cors from "cors";
import { EventController } from "./features/event/event.controller";
import { AuthController } from "./features/auth/auth.controller";
import { ShowController } from "./features/show/show.controller";
import { BookingController } from "./features/booking/booking.controller";
import { PaymentWebhookController } from "./features/booking/payment-webhook.controller";
import { OrganizerController } from "./features/organizer/organizer.controller";
import { VenueController } from "./features/venue/venue.controller";
import { authenticate } from "./shared/middleware/authenticate";
import { startHoldExpiryWorker } from "./shared/holdExpiryWorker";

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(cors({ origin: FRONTEND_URL }));
app.options(/(.*)/, cors({ origin: FRONTEND_URL }));
const PORT = 3000;
const eventController = new EventController();
const authController = new AuthController();
const showController = new ShowController();
const bookingController = new BookingController();
const paymentWebhookController = new PaymentWebhookController();
const organizerController = new OrganizerController();
const venueController = new VenueController();

app.post("/webhooks/payment", express.text({ type: "application/json" }), (req, res) => paymentWebhookController.handle(req, res));

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/events", (req, res) => eventController.listEvents(req, res));
app.get("/events/:eventId", (req, res) => eventController.getEvent(req, res));

app.get("/organizer/events", authenticate, (req, res) => eventController.listMyEvents(req, res));
app.post("/events", authenticate, (req, res) => eventController.createEvent(req, res));
app.patch("/events/:eventId/publish", authenticate, (req, res) => eventController.publishEvent(req, res));
app.get("/events/:eventId/shows", (req, res) => showController.listShows(req, res));
app.get("/shows/:showId/seats", (req, res) => showController.listSeats(req, res));
app.post("/shows/:showId/seats/:seatId/hold", authenticate, (req, res) => showController.holdSeat(req, res));
app.post("/shows/:showId/seats/:seatId/release", authenticate, (req, res) => showController.releaseSeat(req, res));
app.post("/bookings", authenticate, (req, res) => bookingController.createBooking(req, res));
app.get("/bookings", authenticate, (req, res) => bookingController.listMyBookings(req, res));
app.get("/bookings/:id", authenticate, (req, res) => bookingController.getBooking(req, res));
app.post("/bookings/:bookingId/payments", authenticate, (req, res) => bookingController.initiatePayment(req, res));
app.post("/bookings/:bookingId/verify-payment", authenticate, (req, res) => bookingController.verifyPayment(req, res));
app.post("/bookings/:bookingId/cancel", authenticate, (req, res) => bookingController.cancelBooking(req, res));
app.post("/events/:eventId/shows", authenticate, (req, res) => showController.createShow(req, res));
app.get("/organizer/me", authenticate, (req, res) => organizerController.me(req, res));
app.post("/organizer/apply", authenticate, (req, res) => organizerController.apply(req, res));
app.get("/venues", (req, res) => venueController.listVenues(req, res));
app.post("/venues", authenticate, (req, res) => venueController.createVenue(req, res));

app.post("/auth/register", (req, res) => authController.register(req, res));

app.post("/auth/login", (req, res) => authController.login(req, res));

app.listen(PORT, () => {
  console.log(`Evoria backend running on port ${PORT}`);
  startHoldExpiryWorker();
});
