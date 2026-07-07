import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";

export interface Show {
  id: string;
  startsAt: string;
  venueName: string;
  venueCity: string;
  startingPrice: number | null;
}

export function useShows(eventId: string) {
  return useQuery({
    queryKey: ["events", eventId, "shows"],
    queryFn: () => apiRequest<{ data: Show[] }>(`/events/${eventId}/shows`),
  });
}
