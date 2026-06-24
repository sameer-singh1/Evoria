import { prisma } from "../../shared/database/connection";

export class ShowRepository {
  async createWithSeats(data: {
    eventId: string;
    venueId: string;
    startsAt: Date;
    seats: { label: string; price: number }[];
  }) {
    return prisma.show.create({
      data: {
        eventId: data.eventId,
        venueId: data.venueId,
        startsAt: data.startsAt,
        seats: { create: data.seats },
      },
    });
  }
}
