import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";

interface CreateShowSeat {
  label: string;
  price: number;
}

interface CreateShowPayload {
  eventId: string;
  venueId: string;
  startsAt: string;
  seats: CreateShowSeat[];
}

interface CreateShowResponse {
  id: string;
  startsAt: string;
}

export function useCreateShow() {
  return useMutation({
    mutationFn: ({ eventId, ...body }: CreateShowPayload) =>
      apiRequest<CreateShowResponse>(`/events/${eventId}/shows`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}
