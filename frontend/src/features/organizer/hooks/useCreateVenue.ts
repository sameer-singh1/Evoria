import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";
import type { Venue } from "./useVenues";

interface CreateVenuePayload {
  name: string;
  city: string;
  address: string;
}

export function useCreateVenue() {
  return useMutation({
    mutationFn: (payload: CreateVenuePayload) =>
      apiRequest<Venue>("/venues", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}
