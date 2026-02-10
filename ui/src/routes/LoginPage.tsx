"use client";

import {useEffect} from "react";

function base64UrlEncode(input: string) {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomString(length = 32) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}


export default function RedirectPage() {
  useEffect(() => {
    // Generate your URL client-side
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo") ?? "/";

    const csrf = randomString(16);
    sessionStorage.setItem("hometest:nhs-login:csr", csrf);

    const stateObj = { csrf, returnTo };
    const state = base64UrlEncode(JSON.stringify(stateObj));

    // ALPHA: Improve this to use proper values and env variables.
    const nonce = Math.floor(1000 + Math.random() * 9000);
    const callbackUrl = encodeURIComponent(
      `${window.location.origin}/callback`
    );
    window.location.href = `https://auth.sandpit.signin.nhs.uk/authorize` +
      `?response_type=code` +
      `&client_id=hometest` +
      `&redirect_uri=${callbackUrl}` +
      `&scope=${(encodeURIComponent("openid profile email phone"))}` +
      `&state=${encodeURIComponent(state)}` +
      `&nonce=${nonce}`;
  }, []);
  return null;
}
