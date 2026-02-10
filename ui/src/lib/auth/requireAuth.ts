import { redirect } from "react-router-dom";

export async function requireAuth({ request }: { request: Request }) {
  const sessionUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!sessionUrl) throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");

  const res = await fetch(`${sessionUrl}/session`, {
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

  return null;
}
