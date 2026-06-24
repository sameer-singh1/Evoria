import { Request, Response } from "express";
import { PaymentWebhookService } from "./payment-webhook.service";

export class PaymentWebhookController {
  private service = new PaymentWebhookService();

  async handle(req: Request, res: Response) {
    const signature = req.headers["x-webhook-signature"] as string;
    const rawBody = req.body;
const { bookingId } = JSON.parse(rawBody);

    try {
      await this.service.processPayment(signature, rawBody, bookingId);
      res.json({ received: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Webhook processing failed";
      const status = message === "Invalid signature" ? 401 : message === "Booking not found" ? 404 : 500;
      res.status(status).json({ error: { message } });
    }
  }
}
