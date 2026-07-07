import { Request, Response } from "express";
import { OrganizerService } from "./organizer.service";

export class OrganizerController {
  private service = new OrganizerService();

  async apply(req: Request, res: Response) {
    const { organizationName } = req.body;
    const { userId, role } = req.user!;

    try {
      const profile = await this.service.apply(userId, role, organizationName);
      res.status(201).json({ id: profile.id, organizationName: profile.organizationName, approvalStatus: profile.approvalStatus });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit application";
      const status = message === "Only organizers can apply" ? 403 : message === "Application already submitted" ? 409 : 500;
      res.status(status).json({ error: { message } });
    }
  }
}
