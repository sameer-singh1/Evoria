import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";

export type Category = "MOVIE" | "CONCERT" | "SPORT" | "WORKSHOP" | "COMEDY" | "FESTIVAL";

export interface EventSummary {
  id: string;
  title: string;
  category: Category;
  description: string | null;
  mediaRef: string | null;
  nextShowDate: string | null;
  venueCity: string | null;
  startingPrice: number | null;
}

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: () => apiRequest<{ data: EventSummary[] }>("/events"),
  });
}
