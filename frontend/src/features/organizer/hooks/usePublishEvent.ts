import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";

interface PublishEventResponse {
  id: string;
  published: boolean;
}

export function usePublishEvent() {
  return useMutation({
    mutationFn: (eventId: string) =>
      apiRequest<PublishEventResponse>(`/events/${eventId}/publish`, {
        method: "PATCH",
      }),
  });
}
