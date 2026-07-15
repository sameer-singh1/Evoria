import { Request, Response } from "express";
import { BookingService } from "./booking.service";

export class BookingController {
  private service = new BookingService();

  async listMyBookings(req: Request, res: Response) {
    const userId = req.user!.userId;
    const bookings = await this.service.listMyBookings(userId);
    res.json({ data: bookings });
  }

  async getBooking(req: Request, res: Response) {
    const bookingId = req.params.id as string;
    const userId = req.user!.userId;

    try {
      const booking = await this.service.getBooking(bookingId, userId);
      res.json(booking);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch booking";
      const status = message === "Booking not found" ? 404 : message === "Forbidden" ? 403 : 500;
      res.status(status).json({ error: { message } });
    }
  }

  async createBooking(req: Request, res: Response) {
    const { showId, seatIds } = req.body;
    const userId = req.user!.userId;

    try {
      const booking = await this.service.createBooking(userId, showId, seatIds);
      res.status(201).json({ id: booking.id, status: booking.status, totalPrice: Number(booking.totalPrice) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create booking";
      const status = message === "One or more seats are no longer available" ? 409 : 500;
      res.status(status).json({ error: { message } });
    }
  }

  async initiatePayment(req: Request, res: Response) {
    const bookingId = req.params.bookingId as string;
    const userId = req.user!.userId;

    try {
      const paymentDetails = await this.service.initiatePayment(bookingId, userId);
      res.status(201).json(paymentDetails);
    } catch (error) {
      console.error("Payment initiation error:", error);
      const message = error instanceof Error ? error.message : "Failed to initiate payment";
      const status = message === "Booking not found" ? 404 : message === "Forbidden" ? 403 : 500;
      res.status(status).json({ error: { message } });
    }
  }

  async verifyPayment(req: Request, res: Response) {
    const bookingId = req.params.bookingId as string;
    const userId = req.user!.userId;
    const { paymentId, orderId, signature } = req.body;

    try {
      const result = await this.service.verifyPayment(bookingId, userId, paymentId, orderId, signature);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to verify payment";
      const status = message === "Booking not found" ? 404 : message === "Forbidden" ? 403 : message === "Invalid payment signature" ? 400 : 500;
      res.status(status).json({ error: { message } });
    }
  }

  async cancelBooking(req: Request, res: Response) {
    const bookingId = req.params.bookingId as string;
    const userId = req.user!.userId;

    try {
      await this.service.cancelBooking(bookingId, userId);
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cancel booking";
      const status = message === "Booking not found" ? 404 : message === "Forbidden" ? 403 : message === "Cannot cancel a confirmed booking" ? 409 : 500;
      res.status(status).json({ error: { message } });
    }
  }
}
