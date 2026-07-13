import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";

export interface Venue {
  id: string;
  name: string;
  city: string;
  address: string;
}

export function useVenues() {
  return useQuery({
    queryKey: ["venues"],
    queryFn: () => apiRequest<{ data: Venue[] }>("/venues"),
  });
}
