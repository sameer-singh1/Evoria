import { prisma } from "../../shared/database/connection";

export class ShowRepository {
  async findSeatsByShowId(showId: string) {
    return prisma.seat.findMany({ where: { showId } });
  }

  async findByEventId(eventId: string) {
    return prisma.show.findMany({
      where: { eventId },
      orderBy: { startsAt: "asc" },
      include: {
        venue: true,
        seats: {
          where: { status: "AVAILABLE" },
          orderBy: { price: "asc" },
          take: 1,
        },
      },
    });
  }

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
