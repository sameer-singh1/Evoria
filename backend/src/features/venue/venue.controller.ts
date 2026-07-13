import { Request, Response } from "express";
import { VenueService } from "./venue.service";

export class VenueController {
  private service = new VenueService();

  async listVenues(req: Request, res: Response) {
    const venues = await this.service.listVenues();
    res.json({ data: venues });
  }

  async createVenue(req: Request, res: Response) {
    const { name, city, address } = req.body;
    const { role } = req.user!;

    try {
      const venue = await this.service.createVenue(role, name, city, address);
      res.status(201).json(venue);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create venue";
      res.status(403).json({ error: { message } });
    }
  }
}
