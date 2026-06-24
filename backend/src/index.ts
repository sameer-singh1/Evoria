import express from "express";
import { EventController } from "./features/event/event.controller";
import { AuthController } from "./features/auth/auth.controller";
import { ShowController } from "./features/show/show.controller";
import { BookingController } from "./features/booking/booking.controller";
import { PaymentWebhookController } from "./features/booking/payment-webhook.controller";
import { authenticate } from "./shared/middleware/authenticate";

const app = express();
const PORT = 3000;
const eventController = new EventController();
const authController = new AuthController();
const showController = new ShowController();
const bookingController = new BookingController();
const paymentWebhookController = new PaymentWebhookController();

app.post("/webhooks/payment", express.text({ type: "application/json" }), (req, res) => paymentWebhookController.handle(req, res));

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/events", (req, res) => eventController.listEvents(req, res));

app.post("/events", authenticate, (req, res) => eventController.createEvent(req, res));
app.get("/events/:eventId/shows", (req, res) => showController.listShows(req, res));
app.get("/shows/:showId/seats", (req, res) => showController.listSeats(req, res));
app.post("/bookings", authenticate, (req, res) => bookingController.createBooking(req, res));
app.post("/events/:eventId/shows", authenticate, (req, res) => showController.createShow(req, res));

app.post("/auth/register", (req, res) => authController.register(req, res));

app.post("/auth/login", (req, res) => authController.login(req, res));

app.listen(PORT, () => {
  console.log(`Evoria backend running on port ${PORT}`);
});
