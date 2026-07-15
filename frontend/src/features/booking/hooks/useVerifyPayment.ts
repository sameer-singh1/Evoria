import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";

interface VerifyPaymentRequest {
  bookingId: string;
  paymentId: string;
  orderId: string;
  signature: string;
}

interface VerifyPaymentResponse {
  id: string;
  status: string;
  totalPrice: number;
  seatCount: number;
}

export function useVerifyPayment() {
  return useMutation<VerifyPaymentResponse, Error, VerifyPaymentRequest>({
    mutationFn: async ({ bookingId, paymentId, orderId, signature }) => {
      return apiRequest<VerifyPaymentResponse>(`/bookings/${bookingId}/verify-payment`, {
        method: "POST",
        body: JSON.stringify({ paymentId, orderId, signature }),
      });
    },
  });
}