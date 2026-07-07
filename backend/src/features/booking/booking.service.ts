import { BookingRepository } from "./booking.repository";
import { SeatRepository } from "./seat.repository";

export class BookingService {
  private bookingRepository = new BookingRepository();
  private seatRepository = new SeatRepository();

  async createBooking(userId: string, showId: string, seatIds: string[]) {
    const seats = await this.seatRepository.findByIds(seatIds);
    const totalPrice = seats.reduce((sum, seat) => sum + Number(seat.price), 0);
    const booking = await this.bookingRepository.create({ userId, showId, totalPrice });
    const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const claims = await Promise.all(
      seatIds.map((seatId) => this.seatRepository.claimSeat(seatId, booking.id, holdExpiresAt))
    );

    if (claims.some((claimed) => !claimed)) {
      await this.seatRepository.releaseSeats(booking.id);
      await this.bookingRepository.cancel(booking.id);
      throw new Error("One or more seats are no longer available");
    }

    return booking;
  }

  async getBooking(bookingId: string, userId: string) {
    const booking = await this.bookingRepository.findByIdWithDetails(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.userId !== userId) throw new Error("Forbidden");

    return {
      id: booking.id,
      status: booking.status,
      totalPrice: Number(booking.totalPrice),
      eventTitle: booking.show.event.title,
      showStartsAt: booking.show.startsAt,
      venueName: booking.show.venue.name,
      venueCity: booking.show.venue.city,
      seats: booking.seats.map((seat) => ({ id: seat.id, label: seat.label, price: Number(seat.price) })),
    };
  }
}
