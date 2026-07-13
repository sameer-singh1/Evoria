import { EventRepository } from "./event.repository";
import { OrganizerRepository } from "../organizer/organizer.repository";
import { Category } from "../../generated/prisma/client";

export class EventService {
  private repository = new EventRepository();
  private organizerRepository = new OrganizerRepository();

  async listPublishedEvents() {
    const events = await this.repository.findPublished();

    return events.map((event) => {
      const show = event.shows[0];

      return {
        id: event.id,
        title: event.title,
        category: event.category,
        description: event.description,
        mediaRef: event.mediaRef,
        nextShowDate: show?.startsAt ?? null,
        venueCity: show?.venue.city ?? null,
        startingPrice: show?.seats[0] ? Number(show.seats[0].price) : null,
      };
    });
  }

  async getEventById(eventId: string) {
    const event = await this.repository.findPublishedById(eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    return {
      id: event.id,
      title: event.title,
      category: event.category,
      description: event.description,
      mediaRef: event.mediaRef,
    };
  }

  async createEvent(organizerId: string, title: string, category: Category, description?: string, mediaRef?: string) {
    const profile = await this.organizerRepository.findByUserId(organizerId);

    if (!profile || profile.approvalStatus !== "APPROVED") {
      throw new Error("Organizer not approved");
    }

    return this.repository.create({ organizerId, title, category, description, mediaRef });
  }

  async publishEvent(organizerId: string, eventId: string) {
    const event = await this.repository.findByIdWithShowCount(eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw new Error("Forbidden");
    }

    if (event._count.shows === 0) {
      throw new Error("Event must have at least one show before publishing");
    }

    return this.repository.publish(eventId);
  }

  async listOrganizerEvents(organizerId: string) {
    const events = await this.repository.findByOrganizerId(organizerId);

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      category: event.category,
      published: event.published,
      showCount: event._count.shows,
      createdAt: event.createdAt,
    }));
  }
}
