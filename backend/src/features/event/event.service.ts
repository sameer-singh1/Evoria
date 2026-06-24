import { EventRepository } from "./event.repository";
import { OrganizerRepository } from "../organizer/organizer.repository";
import { Category } from "../../generated/prisma/client";

export class EventService {
  private repository = new EventRepository();
  private organizerRepository = new OrganizerRepository();

  async listPublishedEvents() {
    return this.repository.findPublished();
  }

  async createEvent(organizerId: string, title: string, category: Category, description?: string, mediaRef?: string) {
    const profile = await this.organizerRepository.findByUserId(organizerId);

    if (!profile || profile.approvalStatus !== "APPROVED") {
      throw new Error("Organizer not approved");
    }

    return this.repository.create({ organizerId, title, category, description, mediaRef });
  }
}
