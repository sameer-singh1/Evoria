import { Request, Response } from "express";
import { EventService } from "./event.service";

export class EventController {
  private service = new EventService();

  async listEvents(req: Request, res: Response) {
    const events = await this.service.listPublishedEvents();
    res.json({ data: events });
  }

  async getEvent(req: Request, res: Response) {
    const eventId = req.params.eventId as string;

    try {
      const event = await this.service.getEventById(eventId);
      res.json(event);
    } catch (error) {
      res.status(404).json({ error: { message: "Event not found" } });
    }
  }

  async listMyEvents(req: Request, res: Response) {
    const organizerId = req.user!.userId;
    const events = await this.service.listOrganizerEvents(organizerId);
    res.json({ data: events });
  }

  async createEvent(req: Request, res: Response) {
    const { title, category, description, mediaRef } = req.body;
    const organizerId = req.user!.userId;

    try {
      const event = await this.service.createEvent(organizerId, title, category, description, mediaRef);
      res.status(201).json({ id: event.id, published: event.published });
    } catch (error) {
      res.status(403).json({ error: { message: "Organizer not approved" } });
    }
  }

  async publishEvent(req: Request, res: Response) {
    const eventId = req.params.eventId as string;
    const organizerId = req.user!.userId;

    try {
      const event = await this.service.publishEvent(organizerId, eventId);
      res.json({ id: event.id, published: event.published });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to publish event";
      const status =
        message === "Event not found" ? 404 :
        message === "Forbidden" ? 403 :
        message === "Event must have at least one show before publishing" ? 409 :
        500;
      res.status(status).json({ error: { message } });
    }
  }
}
