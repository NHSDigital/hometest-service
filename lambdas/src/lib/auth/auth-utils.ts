import cookieParser from "cookie";

function getCookieFromRequest(cookie: string | undefined | null, cookieName: string): string {
  if (cookie === null || cookie === undefined) {
    return "";
  }

  const parsedCookie = cookieParser.parse(cookie);
  const targetCookie: string | undefined = parsedCookie[cookieName];

  return targetCookie ?? "";
}

export function getAuthCookieFromRequest(cookie: string | undefined | null): string {
  return getCookieFromRequest(cookie, "auth");
}

export function getAuthRefreshCookieFromRequest(cookie: string | undefined | null): string {
  return getCookieFromRequest(cookie, "auth_refresh");
}

export function cleanupKey(key: string): string | undefined {
  return key
    .replace(/(-----BEGIN [A-Z ]+ KEY-----)/, "$1\n") // Ensure the beginning of the key has a newline
    .replace(/(-----END [A-Z ]+ KEY-----)/, "\n$1") // Ensure the end of the key has a newline
    .match(/.{1,64}/g) // break into 64-character lines (PEM format spec)
    ?.join("\n");
}
