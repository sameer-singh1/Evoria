import { prisma } from "../../shared/database/connection";

export class TicketRepository {
  async createMany(bookingId: string, seatIds: string[]) {
    await prisma.ticket.createMany({
      data: seatIds.map((seatId) => ({ bookingId, seatId })),
    });
  }
}
