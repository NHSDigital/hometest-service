"use client";

import { useAuth } from "@/state/AuthContext";
import { mapAuthUser } from "@/lib/auth/mapAuthUser";
import { consumeLoginCsrf, verifyState } from "@/lib/auth/loginState";
import { useEffect, useRef } from "react";

import { RoutePath } from "@/lib/models/route-paths";
import { backendUrl } from "@/settings";
import { useNavigate } from "react-router-dom";
import { useAsyncErrorHandler, usePageLoading } from "@/hooks";
import PageLayout from "@/layouts/PageLayout";

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
  const { isLoading, loadingMessage, setLoading } = usePageLoading("Loading...");
  const handleCallback = useAsyncErrorHandler(async () => {
    if (!backendUrl || backendUrl.trim() === "") {
      console.error("Missing NEXT_PUBLIC_BACKEND_URL");
      throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
    }
    const params = new URLSearchParams(globalThis.location.search);
    const code = params.get("code");
    const stateParam = params.get("state");

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

    const response = await fetch(`${backendUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      credentials: "include",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();
    const userData = mapAuthUser(data);

    setUser(userData);
    navigate(returnTo ?? RoutePath.GetSelfTestKitPage);
  });

  useEffect(() => {
    // ALPHA: Revisit this solution to the double call of useEffect.
    if (didRun.current) return;
    didRun.current = true;
    setLoading(true, "Loading...");
    handleCallback();
  }, [handleCallback, setLoading]);

  return <PageLayout isLoading={isLoading} loadingMessage={loadingMessage} />;
}
