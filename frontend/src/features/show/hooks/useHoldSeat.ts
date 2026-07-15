import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";

interface HoldSeatRequest {
  showId: string;
  seatId: string;
}

interface HoldSeatResponse {
  success: boolean;
}

export function useHoldSeat() {
  return useMutation<HoldSeatResponse, Error, HoldSeatRequest>({
    mutationFn: async ({ showId, seatId }) => {
      return apiRequest<HoldSeatResponse>(`/shows/${showId}/seats/${seatId}/hold`, {
        method: "POST",
      });
    },
  });
}