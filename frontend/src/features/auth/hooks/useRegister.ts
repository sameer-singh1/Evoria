import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";

interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: "ATTENDEE" | "ORGANIZER";
}

interface RegisterResponse {
  id: string;
  email: string;
  name: string;
  role: "ATTENDEE" | "ORGANIZER";
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) =>
      apiRequest<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}
