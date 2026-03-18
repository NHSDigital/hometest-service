"use client";

import { generateState, persistLoginCsrf } from "@/lib/auth/loginState";
import { nhsLoginAuthorizeUrl } from "@/settings";
import { useEffect } from "react";

export default function RedirectPage() {
  useEffect(() => {
    // Generate your URL client-side
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo") ?? "/";

    const { csrf, encoded: state } = generateState(returnTo);
    persistLoginCsrf(csrf);

    // ALPHA: Improve this to use proper values and env variables.
    const nonce = Math.floor(1000 + Math.random() * 9000);
    const callbackUrl = encodeURIComponent(`${window.location.origin}/callback`);
    window.location.href =
      `${nhsLoginAuthorizeUrl}` +
      `?response_type=code` +
      `&client_id=hometest` +
      `&redirect_uri=${callbackUrl}` +
      `&scope=${encodeURIComponent("openid profile email phone")}` +
      `&state=${encodeURIComponent(state)}` +
      `&nonce=${nonce}`;
  }, []);
  return null;
}
