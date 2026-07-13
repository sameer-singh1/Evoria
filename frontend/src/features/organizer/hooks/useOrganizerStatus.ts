import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";

export interface OrganizerStatus {
  hasApplied: boolean;
  organizationName?: string;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
}

export function useOrganizerStatus() {
  return useQuery({
    queryKey: ["organizer", "me"],
    queryFn: () => apiRequest<OrganizerStatus>("/organizer/me"),
  });
}
