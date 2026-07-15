import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";

export type SeatStatus = "AVAILABLE" | "HELD" | "BOOKED";

export interface Seat {
  id: string;
  label: string;
  price: number;
  status: SeatStatus;
}

export function useSeats(showId: string) {
  return useQuery({
    queryKey: ["shows", showId, "seats"],
    queryFn: () => apiRequest<{ data: Seat[] }>(`/shows/${showId}/seats`),
    refetchInterval: 3000, // Poll every 3 seconds for real-time seat updates
  });
}
