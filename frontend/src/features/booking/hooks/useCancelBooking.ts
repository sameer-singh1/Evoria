import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";

interface CancelBookingRequest {
  bookingId: string;
}

interface CancelBookingResponse {
  success: boolean;
}

export function useCancelBooking() {
  return useMutation<CancelBookingResponse, Error, CancelBookingRequest>({
    mutationFn: async ({ bookingId }) => {
      return apiRequest<CancelBookingResponse>(`/bookings/${bookingId}/cancel`, {
        method: "POST",
      });
    },
  });
}