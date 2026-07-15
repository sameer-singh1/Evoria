import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";

interface InitiatePaymentRequest {
  bookingId: string;
}

interface InitiatePaymentResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export function useInitiatePayment() {
  return useMutation<InitiatePaymentResponse, Error, InitiatePaymentRequest>({
    mutationFn: async ({ bookingId }) => {
      return apiRequest<InitiatePaymentResponse>(`/bookings/${bookingId}/payments`, {
        method: "POST",
      });
    },
  });
}