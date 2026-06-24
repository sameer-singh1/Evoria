import { ShowRepository } from "./show.repository";
import { EventRepository } from "../event/event.repository";

export class ShowService {
  private repository = new ShowRepository();
  private eventRepository = new EventRepository();

  async createShow(
    organizerId: string,
    eventId: string,
    venueId: string,
    startsAt: string,
    seats: { label: string; price: number }[]
  ) {
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== organizerId) {
      throw new Error("Forbidden");
    }

    return this.repository.createWithSeats({ eventId, venueId, startsAt: new Date(startsAt), seats });
  }
}
