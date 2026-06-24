import { Request, Response } from "express";
import { EventService } from "./event.service";

export class EventController {
  private service = new EventService();

  async listEvents(req: Request, res: Response) {
    const events = await this.service.listPublishedEvents();
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
}
