import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";

interface CreateBookingPayload {
  showId: string;
  seatIds: string[];
}

interface CreateBookingResponse {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  totalPrice: number;
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) =>
      apiRequest<CreateBookingResponse>("/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}
