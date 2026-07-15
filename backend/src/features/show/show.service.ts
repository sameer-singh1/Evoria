import { ShowRepository } from "./show.repository";
import { EventRepository } from "../event/event.repository";
import { SeatRepository } from "../booking/seat.repository";

export class ShowService {
  private repository = new ShowRepository();
  private eventRepository = new EventRepository();
  private seatRepository = new SeatRepository();

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

  async holdSeat(showId: string, seatId: string, userId: string) {
    const seat = await this.repository.findSeatById(seatId);
    if (!seat) throw new Error("Seat not found");
    if (seat.showId !== showId) throw new Error("Seat does not belong to this show");

    const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const held = await this.seatRepository.holdSeat(seatId, userId, holdExpiresAt);
    if (!held) throw new Error("Seat is no longer available");

    return { success: true };
  }

  async releaseSeat(showId: string, seatId: string, userId: string) {
    const seat = await this.repository.findSeatById(seatId);
    if (!seat) throw new Error("Seat not found");
    if (seat.showId !== showId) throw new Error("Seat does not belong to this show");

    const released = await this.seatRepository.releaseSeatByUser(seatId, userId);
    if (!released) throw new Error("Seat is not held by you");

    return { success: true };
  }
}
