"use client";

import { useEffect } from "react";

import { generateState, persistLoginCsrf } from "@/lib/auth/loginState";

export default function RedirectPage() {
  useEffect(() => {
    // Generate your URL client-side
    const params = new URLSearchParams(globalThis.location.search);
    const returnTo = params.get("returnTo") ?? "/";

    const { csrf, encoded: state } = generateState(returnTo);
    persistLoginCsrf(csrf);

    // ALPHA: Improve this to use proper values and env variables.
    const nonce = Math.floor(1000 + Math.random() * 9000);
    const callbackUrl = encodeURIComponent(`${globalThis.location.origin}/callback`);
    globalThis.location.href =
      `https://auth.sandpit.signin.nhs.uk/authorize` +
      `?response_type=code` +
      `&client_id=hometest` +
      `&redirect_uri=${callbackUrl}` +
      `&scope=${encodeURIComponent("openid profile email phone")}` +
      `&state=${encodeURIComponent(state)}` +
      `&nonce=${nonce}`;
  }, []);
  return null;
}
