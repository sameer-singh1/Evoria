import express from "express";
import { EventController } from "./features/event/event.controller";
import { AuthController } from "./features/auth/auth.controller";
import { ShowController } from "./features/show/show.controller";
import { authenticate } from "./shared/middleware/authenticate";

const app = express();
const PORT = 3000;
const eventController = new EventController();
const authController = new AuthController();
const showController = new ShowController();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/events", (req, res) => eventController.listEvents(req, res));

app.post("/events", authenticate, (req, res) => eventController.createEvent(req, res));
app.post("/events/:eventId/shows", authenticate, (req, res) => showController.createShow(req, res));

app.post("/auth/register", (req, res) => authController.register(req, res));

app.post("/auth/login", (req, res) => authController.login(req, res));

app.listen(PORT, () => {
  console.log(`Evoria backend running on port ${PORT}`);
});
