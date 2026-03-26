import { useWiremockAuth } from "@/settings";

const localAuthLoginHintStorageKey = "wiremockLoginHint";

function resolveStoredLoginHint(queryLoginHint: string | null): string | null {
  if (!useWiremockAuth) {
    return null;
  }

  if (queryLoginHint) {
    globalThis.localStorage.setItem(localAuthLoginHintStorageKey, queryLoginHint);
    return queryLoginHint;
  }

  return globalThis.localStorage.getItem(localAuthLoginHintStorageKey);
}

export function getAuthorizeLoginHintFragment(queryLoginHint: string | null): string {
  const loginHint = resolveStoredLoginHint(queryLoginHint);
  return loginHint ? `&login_hint=${encodeURIComponent(loginHint)}` : "";
}
