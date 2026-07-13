import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";
import type { Category } from "../../event/hooks/useEvents";

interface CreateEventPayload {
  title: string;
  category: Category;
  description?: string;
  mediaRef?: string;
}

interface CreateEventResponse {
  id: string;
  published: boolean;
}

export function useCreateEvent() {
  return useMutation({
    mutationFn: (payload: CreateEventPayload) =>
      apiRequest<CreateEventResponse>("/events", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}
