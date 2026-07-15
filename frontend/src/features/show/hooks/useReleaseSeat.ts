import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";

interface ReleaseSeatRequest {
  showId: string;
  seatId: string;
}

interface ReleaseSeatResponse {
  success: boolean;
}

export function useReleaseSeat() {
  return useMutation<ReleaseSeatResponse, Error, ReleaseSeatRequest>({
    mutationFn: async ({ showId, seatId }) => {
      return apiRequest<ReleaseSeatResponse>(`/shows/${showId}/seats/${seatId}/release`, {
        method: "POST",
      });
    },
  });
}