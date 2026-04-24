"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { usePageTitle } from "@/hooks";
import { getAuthorizeLoginHintFragment } from "@/lib/auth/loginHint";
import { generateState, persistLoginCsrf } from "@/lib/auth/loginState";
import { RoutePath } from "@/lib/models/route-paths";
import { formatPageTitle } from "@/lib/utils/page-title";
import * as settings from "@/settings";

export default function RedirectPage() {
  const navigate = useNavigate();

  usePageTitle(formatPageTitle("Sign in"));

  useEffect(() => {
    const authorizeUrl = settings.nhsLoginAuthorizeUrl?.trim();
    const clientId = settings.nhsLoginClientId?.trim();
    const scope = settings.nhsLoginScope?.trim();

    if (!authorizeUrl || !clientId || !scope) {
      const missingConfigError =
        "Missing NHS Login configuration. Ensure NEXT_PUBLIC_NHS_LOGIN_AUTHORIZE_URL, NEXT_PUBLIC_NHS_LOGIN_CLIENT_ID, and NEXT_PUBLIC_NHS_LOGIN_SCOPE are set.";
      console.error(missingConfigError);
      navigate(RoutePath.ServiceErrorPage, {
        replace: true,
        state: { errorMessage: missingConfigError },
      });
      return;
    }

    // Generate your URL client-side
    const params = new URLSearchParams(globalThis.location.search);
    const returnTo = params.get("returnTo") ?? "/";
    const loginHintQuery = getAuthorizeLoginHintFragment(params.get("login_hint"));

    const { csrf, encoded: state } = generateState(returnTo);
    persistLoginCsrf(csrf);

    const nonce = globalThis.crypto.randomUUID();
    const callbackUrl = encodeURIComponent(`${globalThis.location.origin}/callback`);
    globalThis.location.href =
      `${authorizeUrl}` +
      `?response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${callbackUrl}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${encodeURIComponent(state)}` +
      loginHintQuery +
      `&nonce=${nonce}`;
  }, [navigate]);
  return null;
}
