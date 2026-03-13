import { AuthUser } from "@/state";
import { mapAuthUser } from "@/lib/auth/mapAuthUser";
import { backendUrl } from "@/settings";
import { redirect } from "react-router-dom";

export interface SessionData {
  user: AuthUser;
}

export async function requireAuth({ request }: { request: Request }): Promise<SessionData> {
  if (!backendUrl || backendUrl.trim() === "") {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
  }

  const res = await fetch(`${backendUrl}/session`, {
    method: "GET",
    credentials: "include",
  });

  if (res.status === 401) {
    const attemptedUrl = new URL(request.url);
    const returnTo = `${attemptedUrl.pathname}${attemptedUrl.search}${attemptedUrl.hash}`;

    throw redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  if (!res.ok) {
    throw new Error(`Session check failed: HTTP ${res.status}`);
  }

  const data = await res.json();

  const userData = mapAuthUser(data);

  return { user: userData };
}
