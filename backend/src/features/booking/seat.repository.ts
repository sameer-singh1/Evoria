import { prisma } from "../../shared/database/connection";

export class SeatRepository {
  async findByIds(seatIds: string[]) {
    return prisma.seat.findMany({ where: { id: { in: seatIds } } });
  }

  async findByBookingId(bookingId: string) {
    return prisma.seat.findMany({ where: { bookingId } });
  }

  async bookSeats(bookingId: string) {
    await prisma.seat.updateMany({
      where: { bookingId },
      data: { status: "BOOKED", holdExpiresAt: null },
    });
  }

  async releaseSeats(bookingId: string) {
    await prisma.seat.updateMany({
      where: { bookingId },
      data: { status: "AVAILABLE", bookingId: null, holdExpiresAt: null },
    });
  }

  async claimSeat(seatId: string, bookingId: string, holdExpiresAt: Date) {
    const result = await prisma.seat.updateMany({
      where: { id: seatId, status: { in: ["AVAILABLE", "HELD"] } },
      data: { status: "HELD", bookingId, holdExpiresAt },
    });
    return result.count === 1;
  }

  async holdSeat(seatId: string, userId: string, holdExpiresAt: Date) {
    const result = await prisma.seat.updateMany({
      where: { id: seatId, status: "AVAILABLE" },
      data: { status: "HELD", heldByUserId: userId, holdExpiresAt },
    });
    return result.count === 1;
  }

  async releaseSeatByUser(seatId: string, userId: string) {
    const result = await prisma.seat.updateMany({
      where: { id: seatId, status: "HELD", heldByUserId: userId },
      data: { status: "AVAILABLE", heldByUserId: null, holdExpiresAt: null },
    });
    return result.count === 1;
  }
}
