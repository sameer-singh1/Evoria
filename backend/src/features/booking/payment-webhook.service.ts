import * as crypto from "crypto";
import { BookingRepository } from "./booking.repository";
import { SeatRepository } from "./seat.repository";
import { TicketRepository } from "./ticket.repository";
import { RAZORPAY_KEY_SECRET } from "../../shared/razorpay";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) {
  throw new Error("RAZORPAY_WEBHOOK_SECRET or PAYMENT_WEBHOOK_SECRET must be set");
}

export class PaymentWebhookService {
  private bookingRepository = new BookingRepository();
  private seatRepository = new SeatRepository();
  private ticketRepository = new TicketRepository();

  async processPayment(signature: string, rawBody: string, bookingId: string) {
    const expected = crypto.createHmac("sha256", WEBHOOK_SECRET!).update(rawBody).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      throw new Error("Invalid signature");
    }

    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }
    if (booking.status === "CONFIRMED") {
      return;
    }

    await this.bookingRepository.confirm(bookingId);
    await this.seatRepository.bookSeats(bookingId);
    const seats = await this.seatRepository.findByBookingId(bookingId);
    await this.ticketRepository.createMany(bookingId, seats.map((s) => s.id));
  }

  async processRazorpayWebhook(event: string, payload: any) {
    if (event === "payment.captured") {
      const { id: paymentId, order_id: orderId, notes } = payload;
      const bookingId = notes?.bookingId;

      if (!bookingId) {
        throw new Error("Booking ID not found in webhook payload");
      }

      const booking = await this.bookingRepository.findById(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }

      if (booking.status === "CONFIRMED") {
        return;
      }

      await this.bookingRepository.confirm(bookingId);
      await this.seatRepository.bookSeats(bookingId);
      const seats = await this.seatRepository.findByBookingId(bookingId);
      await this.ticketRepository.createMany(bookingId, seats.map((s) => s.id));
    } else if (event === "payment.failed") {
      const { notes } = payload;
      const bookingId = notes?.bookingId;

      if (!bookingId) {
        throw new Error("Booking ID not found in webhook payload");
      }

      await this.bookingRepository.cancel(bookingId);
      await this.seatRepository.releaseSeats(bookingId);
    }
  }
}
