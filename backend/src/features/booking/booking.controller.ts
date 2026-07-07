import { Request, Response } from "express";
import { BookingService } from "./booking.service";

export class BookingController {
  private service = new BookingService();

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
}
