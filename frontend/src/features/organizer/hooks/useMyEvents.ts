import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";
import type { Category } from "../../event/hooks/useEvents";

export interface MyEvent {
  id: string;
  title: string;
  category: Category;
  published: boolean;
  showCount: number;
  createdAt: string;
}

export function useMyEvents() {
  return useQuery({
    queryKey: ["organizer", "events"],
    queryFn: () => apiRequest<{ data: MyEvent[] }>("/organizer/events"),
  });
}
