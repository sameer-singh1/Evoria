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

  async confirm(bookingId: string) {
    await prisma.booking.update({ where: { id: bookingId }, data: { status: "CONFIRMED" } });
  }
}
