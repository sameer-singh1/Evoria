import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";

interface ApplyPayload {
  organizationName: string;
}

interface ApplyResponse {
  id: string;
  organizationName: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
}

export function useApplyOrganizer() {
  return useMutation({
    mutationFn: (payload: ApplyPayload) =>
      apiRequest<ApplyResponse>("/organizer/apply", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}
