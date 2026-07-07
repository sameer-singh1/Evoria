import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";

export interface BookingDetail {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  totalPrice: number;
  eventTitle: string;
  showStartsAt: string;
  venueName: string;
  venueCity: string;
  seats: { id: string; label: string; price: number }[];
}

export function useBooking(bookingId: string) {
  return useQuery({
    queryKey: ["bookings", bookingId],
    queryFn: () => apiRequest<BookingDetail>(`/bookings/${bookingId}`),
  });
}
