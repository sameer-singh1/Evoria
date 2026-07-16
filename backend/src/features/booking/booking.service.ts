import * as crypto from "crypto";
import { BookingRepository } from "./booking.repository";
import { SeatRepository } from "./seat.repository";
import { razorpay, RAZORPAY_KEY_SECRET } from "../../shared/razorpay";

export class BookingService {
  private bookingRepository = new BookingRepository();
  private seatRepository = new SeatRepository();

  async createBooking(userId: string, showId: string, seatIds: string[]) {
    console.log(`[Booking] createBooking: userId=${userId}, showId=${showId}, seatIds=${seatIds.join(",")}`);
    const seats = await this.seatRepository.findByIds(seatIds);
    const totalPrice = seats.reduce((sum, seat) => sum + Number(seat.price), 0);
    console.log(`[Booking] totalPrice=${totalPrice}, creating booking record...`);
    const booking = await this.bookingRepository.create({ userId, showId, totalPrice });
    console.log(`[Booking] booking created: bookingId=${booking.id}`);
    const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const claims = await Promise.all(
      seatIds.map((seatId) => this.seatRepository.claimSeat(seatId, booking.id, holdExpiresAt))
    );

    if (claims.some((claimed) => !claimed)) {
      console.warn(`[Booking] seat claim failed for bookingId=${booking.id}, releasing and cancelling`);
      await this.seatRepository.releaseSeats(booking.id);
      await this.bookingRepository.cancel(booking.id);
      throw new Error("One or more seats are no longer available");
    }

    console.log(`[Booking] all seats claimed successfully for bookingId=${booking.id}`);
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

  async listMyBookings(userId: string) {
    const bookings = await this.bookingRepository.findByUserId(userId);

    return bookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      totalPrice: Number(booking.totalPrice),
      eventTitle: booking.show.event.title,
      showStartsAt: booking.show.startsAt,
      venueName: booking.show.venue.name,
      venueCity: booking.show.venue.city,
      seatCount: booking.seats.length,
    }));
  }

  async cancelBooking(bookingId: string, userId: string) {
    console.log(`[Booking] cancelBooking: bookingId=${bookingId}, userId=${userId}`);
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.userId !== userId) throw new Error("Forbidden");
    if (booking.status === "CONFIRMED") throw new Error("Cannot cancel a confirmed booking");

    await this.seatRepository.releaseSeats(bookingId);
    await this.bookingRepository.cancel(bookingId);
    console.log(`[Booking] booking cancelled and seats released: bookingId=${bookingId}`);
  }

  async initiatePayment(bookingId: string, userId: string) {
    console.log(`[Payment] initiatePayment: bookingId=${bookingId}, userId=${userId}`);
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.userId !== userId) throw new Error("Forbidden");
    if (booking.status !== "PENDING") throw new Error("Booking is not in PENDING state");

    const amountInPaise = Math.round(Number(booking.totalPrice) * 100);
    console.log(`[Payment] creating Razorpay order: amount=${amountInPaise} paise`);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `booking_${bookingId.slice(0, 20)}`,
    });

    console.log(`[Payment] Razorpay order created: orderId=${order.id}`);
    return {
      orderId: order.id,
      amount: Number(booking.totalPrice),
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  }

  async verifyPayment(
    bookingId: string,
    userId: string,
    paymentId: string,
    orderId: string,
    signature: string
  ) {
    console.log(`[Payment] verifyPayment: bookingId=${bookingId}, paymentId=${paymentId}, orderId=${orderId}`);
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.userId !== userId) throw new Error("Forbidden");

    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET!).update(body).digest("hex");

    if (signature !== expectedSignature) {
      console.error(`[Payment] signature mismatch for bookingId=${bookingId}`);
      throw new Error("Invalid payment signature");
    }

    console.log(`[Payment] signature verified, confirming booking: bookingId=${bookingId}`);
    await this.bookingRepository.confirm(bookingId);
    await this.seatRepository.bookSeats(bookingId);
    const seats = await this.seatRepository.findByBookingId(bookingId);
    console.log(`[Payment] booking confirmed: bookingId=${bookingId}, seats=${seats.length}`);
    
    return {
      id: booking.id,
      status: "CONFIRMED",
      totalPrice: Number(booking.totalPrice),
      seatCount: seats.length,
    };
  }
}
