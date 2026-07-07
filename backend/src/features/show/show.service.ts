import { ShowRepository } from "./show.repository";
import { EventRepository } from "../event/event.repository";

export class ShowService {
  private repository = new ShowRepository();
  private eventRepository = new EventRepository();

  async listSeats(showId: string) {
    const seats = await this.repository.findSeatsByShowId(showId);

    return seats.map((seat) => ({
      id: seat.id,
      label: seat.label,
      price: Number(seat.price),
      status: seat.status,
    }));
  }

  async listShows(eventId: string) {
    const shows = await this.repository.findByEventId(eventId);

    return shows.map((show) => ({
      id: show.id,
      startsAt: show.startsAt,
      venueName: show.venue.name,
      venueCity: show.venue.city,
      startingPrice: show.seats[0] ? Number(show.seats[0].price) : null,
    }));
  }

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
