import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";
import type { Category } from "./useEvents";

export interface EventDetail {
  id: string;
  title: string;
  category: Category;
  description: string | null;
  mediaRef: string | null;
}

export function useEventDetail(eventId: string) {
  return useQuery({
    queryKey: ["event", eventId],
    queryFn: () => apiRequest<EventDetail>(`/events/${eventId}`),
  });
}
