import { Request, Response } from "express";
import { EventService } from "./event.service";

export class EventController {
  private service = new EventService();

  async listEvents(req: Request, res: Response) {
    const events = await this.service.listPublishedEvents();
    res.json({ data: events });
  }
}
