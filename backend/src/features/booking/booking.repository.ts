import { prisma } from "../../shared/database/connection";

export class BookingRepository {
  async create(data: { userId: string; showId: string; totalPrice: number }) {
    return prisma.booking.create({ data: { ...data, status: "PENDING" } });
  }

  async cancel(bookingId: string) {
    await prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });
  }

  async findById(bookingId: string) {
    return prisma.booking.findUnique({ where: { id: bookingId } });
  }

  async findByIdWithDetails(bookingId: string) {
    return prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        seats: { select: { id: true, label: true, price: true, status: true } },
        tickets: { select: { id: true, seatId: true, status: true } },
        show: { include: { event: true, venue: true } },
      },
    });
  }

  async confirm(bookingId: string) {
    await prisma.booking.update({ where: { id: bookingId }, data: { status: "CONFIRMED" } });
  }

  async findByUserId(userId: string) {
    return prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        seats: { select: { id: true } },
        show: { include: { event: true, venue: true } },
      },
    });
  }
}
