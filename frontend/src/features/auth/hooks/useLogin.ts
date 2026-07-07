import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/api";
import { useAuthStore } from "../../../shared/store/authStore";

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: "ATTENDEE" | "ORGANIZER" | "ADMIN";
  };
}

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setSession(data.token, data.user);
    },
  });
}
