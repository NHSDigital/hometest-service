"use client";

import { useEffect } from "react";

export default function RedirectPage() {
  useEffect(() => {
    // Generate your URL client-side

    // ALPHA: Improve this to use proper values and env variables.
    const nonce = Math.floor(1000 + Math.random() * 9000);
    const callbackUrl = encodeURIComponent(
      `${window.location.origin}/callback`
    );
    const scopes = encodeURIComponent("openid profile email phone");
    const url = `https://auth.sandpit.signin.nhs.uk/authorize?response_type=code&client_id=hometest&redirect_uri=${callbackUrl}&scope=${scopes}&state=12345&nonce=${nonce}`;

    // Redirect the browser
    window.location.href = url;
  }, []);
  return null;
}
