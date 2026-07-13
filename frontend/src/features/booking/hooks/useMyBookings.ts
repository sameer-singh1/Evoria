import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";

export interface MyBooking {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  totalPrice: number;
  eventTitle: string;
  showStartsAt: string;
  venueName: string;
  venueCity: string;
  seatCount: number;
}

export function useMyBookings() {
  return useQuery({
    queryKey: ["bookings", "mine"],
    queryFn: () => apiRequest<{ data: MyBooking[] }>("/bookings"),
  });
}
