import express from "express";
import { EventController } from "./features/event/event.controller";
import { AuthController } from "./features/auth/auth.controller";

const app = express();
const PORT = 3000;
const eventController = new EventController();
const authController = new AuthController();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/events", (req, res) => eventController.listEvents(req, res));

app.post("/auth/register", (req, res) => authController.register(req, res));

app.listen(PORT, () => {
  console.log(`Evoria backend running on port ${PORT}`);
});
