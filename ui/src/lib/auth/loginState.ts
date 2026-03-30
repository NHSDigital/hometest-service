import { base64UrlDecode, base64UrlEncode } from "@/lib/utils/base64url";

const STATE_CSRF_KEY = "hometest:nhs-login:csr";

function randomString(length = 32) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface RedirectState {
  encoded: string;
  csrf: string;
}

interface State {
  csrf: string;
  returnTo: string;
}

export function generateState(url: string): RedirectState {
  const csrf = randomString(16);

  const stateObj: State = { csrf, returnTo: url };
  const state = base64UrlEncode(JSON.stringify(stateObj));

  return { encoded: state, csrf };
}

export function verifyState(given: RedirectState): string | null {
  const decoded = base64UrlDecode(given.encoded);
  const parsed = JSON.parse(decoded) as State;

  if (parsed.csrf !== given.csrf) {
    throw new Error("Invalid state");
  }

  return parsed.returnTo ?? null;
}

export function persistLoginCsrf(csrf: string) {
  sessionStorage.setItem(STATE_CSRF_KEY, csrf);
}

export function consumeLoginCsrf(): string | null {
  const csrf = sessionStorage.getItem(STATE_CSRF_KEY);
  sessionStorage.removeItem(STATE_CSRF_KEY);
  return csrf;
}
