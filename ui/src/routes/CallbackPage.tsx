"use client";

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useAsyncErrorHandler, usePageTitle } from "@/hooks";
import { consumeLoginCsrf, verifyState } from "@/lib/auth/loginState";
import { RoutePath } from "@/lib/models/route-paths";
import loginService from "@/lib/services/login-service";
import { formatPageTitle } from "@/lib/utils/page-title";
import { useAuth } from "@/state";

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

  usePageTitle(formatPageTitle("Signing you in"));

  const handleCallback = useAsyncErrorHandler(async () => {
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

    const userData = await loginService.login(code);

    setUser(userData);
    navigate(returnTo ?? RoutePath.BeforeYouStartPage);
  });

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    handleCallback();
  }, [handleCallback]);
  return null;
}
