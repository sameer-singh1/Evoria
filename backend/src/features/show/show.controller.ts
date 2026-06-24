import { Request, Response } from "express";
import { ShowService } from "./show.service";

export class ShowController {
  private service = new ShowService();

  async listSeats(req: Request, res: Response) {
    const showId = req.params.showId as string;
    const seats = await this.service.listSeats(showId);
    res.json({ data: seats });
  }

  async listShows(req: Request, res: Response) {
    const eventId = req.params.eventId as string;
    const shows = await this.service.listShows(eventId);
    res.json({ data: shows });
  }

  async createShow(req: Request, res: Response) {
    const { venueId, startsAt, seats } = req.body;
    const eventId = req.params.eventId as string;
    const organizerId = req.user!.userId;

    try {
      const show = await this.service.createShow(organizerId, eventId, venueId, startsAt, seats);
      res.status(201).json({ id: show.id, startsAt: show.startsAt });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create show";
      const status = message === "Event not found" ? 404 : message === "Forbidden" ? 403 : 500;
      res.status(status).json({ error: { message } });
    }
  }
}
