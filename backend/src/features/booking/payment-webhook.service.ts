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
    console.log(`[Webhook] processPayment: bookingId=${bookingId}`);
    const expected = crypto.createHmac("sha256", WEBHOOK_SECRET!).update(rawBody).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      console.error(`[Webhook] signature verification failed for bookingId=${bookingId}`);
      throw new Error("Invalid signature");
    }

    console.log(`[Webhook] signature verified for bookingId=${bookingId}`);
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }
    if (booking.status === "CONFIRMED") {
      console.log(`[Webhook] booking already confirmed: bookingId=${bookingId}`);
      return;
    }

    console.log(`[Webhook] confirming booking and creating tickets: bookingId=${bookingId}`);
    await this.bookingRepository.confirm(bookingId);
    await this.seatRepository.bookSeats(bookingId);
    const seats = await this.seatRepository.findByBookingId(bookingId);
    await this.ticketRepository.createMany(bookingId, seats.map((s) => s.id));
    console.log(`[Webhook] payment processed successfully: bookingId=${bookingId}, tickets=${seats.length}`);
  }

  async processRazorpayWebhook(event: string, payload: any) {
    console.log(`[Webhook] processRazorpayWebhook: event=${event}`);
    if (event === "payment.captured") {
      const { id: paymentId, order_id: orderId, notes } = payload;
      const bookingId = notes?.bookingId;

      if (!bookingId) {
        console.error(`[Webhook] Booking ID not found in payment.captured payload`);
        throw new Error("Booking ID not found in webhook payload");
      }

      console.log(`[Webhook] payment.captured: bookingId=${bookingId}, paymentId=${paymentId}`);
      const booking = await this.bookingRepository.findById(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }

      if (booking.status === "CONFIRMED") {
        console.log(`[Webhook] booking already confirmed: bookingId=${bookingId}`);
        return;
      }

      console.log(`[Webhook] confirming booking and creating tickets: bookingId=${bookingId}`);
      await this.bookingRepository.confirm(bookingId);
      await this.seatRepository.bookSeats(bookingId);
      const seats = await this.seatRepository.findByBookingId(bookingId);
      await this.ticketRepository.createMany(bookingId, seats.map((s) => s.id));
      console.log(`[Webhook] payment.captured processed: bookingId=${bookingId}, tickets=${seats.length}`);
    } else if (event === "payment.failed") {
      const { notes } = payload;
      const bookingId = notes?.bookingId;

      if (!bookingId) {
        console.error(`[Webhook] Booking ID not found in payment.failed payload`);
        throw new Error("Booking ID not found in webhook payload");
      }

      console.log(`[Webhook] payment.failed: bookingId=${bookingId}, cancelling booking and releasing seats`);
      await this.bookingRepository.cancel(bookingId);
      await this.seatRepository.releaseSeats(bookingId);
      console.log(`[Webhook] payment.failed processed: bookingId=${bookingId}`);
    }
  }
}
