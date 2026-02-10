"use client";

import { useEffect, useState, useRef } from "react";
import { useCreateOrderContext } from "@/state/OrderContext";
import { RoutePath } from "@/lib/models/route-paths";
import { useNavigate } from "react-router-dom";

function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function safeReturnTo(value: string | null | undefined) {
  if (!value) return null;
  // Allow only in-app relative paths to avoid open redirects.
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

function validateState(givenState: string | null | undefined): string | null {
  const expectedCsrf = sessionStorage.getItem("hometest:nhs-login:csr");
  sessionStorage.removeItem("hometest:nhs-login:csr");

  if (!expectedCsrf || !givenState) {
    throw new Error("Missing state");
  }

  const decoded = base64UrlDecode(givenState);
  const parsed = JSON.parse(decoded) as { csrf?: string; returnTo?: string };

  if (parsed.csrf !== expectedCsrf) {
    throw new Error("Invalid state");
  }

  return safeReturnTo(parsed.returnTo) ?? null;
}

export default function CallbackPage() {
  type Result =
  | null
  | { data: unknown }
  | { error: string };

  const { updateOrderAnswers } = useCreateOrderContext();
  const [result, setResult] = useState<Result>(null);
  const navigate = useNavigate();
  const didRun = useRef(false);

  useEffect(() => {
    // ALPHA: Revisit this solution to the double call of useEffect.
    if (didRun.current) return;
    didRun.current = true;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      console.error("Missing NEXT_PUBLIC_BACKEND_URL");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const stateParam = params.get("state");

    console.log("Params:", params.toString());
    console.log("Authorization code:", code);

    if (!code) return;

    let returnTo: string | null = null;
    try {
      returnTo = validateState(stateParam) ?? null;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("State validation failed:", message);
      navigate(RoutePath.LoginPage);
      return;
    }

    fetch(`${backendUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        updateOrderAnswers({
          user: {
            sub: data.sub,
            nhsNumber: data.nhs_number,
            birthdate: data.birthdate,
            identityProofingLevel: data.identity_proofing_level,
            phoneNumber: data.phone_number,
          },
        });
      })
      .then(() => {
        navigate(returnTo ?? RoutePath.GetSelfTestKitPage);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Fetch error:", message);
        setResult({ error: message });
      });
  }, [updateOrderAnswers, navigate]);
  return null;
}
