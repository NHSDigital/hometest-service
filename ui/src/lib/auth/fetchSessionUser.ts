import { mapAuthUser } from "@/lib/auth/mapAuthUser";
import { backendUrl } from "@/settings";
import type { AuthUser } from "@/state/AuthContext";

export class SessionUnauthenticatedError extends Error {
  constructor() {
    super("Unauthenticated session");
    this.name = "SessionUnauthenticatedError";
  }
}

export async function fetchSessionUser(): Promise<AuthUser> {
  if (!backendUrl || backendUrl.trim() === "") {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }

  const response = await fetch(`${backendUrl}/session`, {
    method: "GET",
    credentials: "include",
  });

  if (response.status === 401) {
    throw new SessionUnauthenticatedError();
  }

  if (!response.ok) {
    throw new Error(`Session check failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  return mapAuthUser(data);
}
