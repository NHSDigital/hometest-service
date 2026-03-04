"use client";

import { useAuth } from "@/state/AuthContext";
import { mapAuthUser } from "@/lib/auth/mapAuthUser";
import { consumeLoginCsrf, verifyState } from "@/lib/auth/loginState";
import { useEffect, useRef } from "react";

import { RoutePath } from "@/lib/models/route-paths";
import { backendUrl } from "@/settings";
import { useNavigate } from "react-router-dom";

function safeReturnTo(value: string | null | undefined) {
  if (!value) return null;
  // Allow only in-app relative paths to avoid open redirects.
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

function getReturnTo(givenState: string | null | undefined): string | null {
  const expectedCsrf = consumeLoginCsrf();

  if (!expectedCsrf || !givenState) {
    throw new Error("Missing state");
  }

  const returnTo = verifyState({
    csrf: expectedCsrf,
    encoded: givenState,
  });

  return safeReturnTo(returnTo) ?? null;
}

export default function CallbackPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const didRun = useRef(false);

  useEffect(() => {
    // ALPHA: Revisit this solution to the double call of useEffect.
    if (didRun.current) return;
    didRun.current = true;

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
      returnTo = getReturnTo(stateParam) ?? null;
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
        const userData = mapAuthUser(data);

        setUser(userData);
      })
      .then(() => {
        navigate(returnTo ?? RoutePath.GetSelfTestKitPage);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Fetch error:", message);
      });
  }, [setUser, navigate]);
  return null;
}
