export const PREVIEW_SESSION_ACCESS_COOKIE_NAME = "preview_auth";
export const PREVIEW_SESSION_REFRESH_COOKIE_NAME = "preview_auth_refresh";
export const PREVIEW_SESSION_ACCESS_COOKIE_PATH = "/session-preview";
export const PREVIEW_SESSION_REFRESH_COOKIE_PATH = "/session-preview/refresh";

function secureAttribute(secure: boolean): string {
  return secure ? " Secure;" : "";
}

export function buildPreviewAccessCookie(token: string, sameSite: string, secure: boolean): string {
  return `${PREVIEW_SESSION_ACCESS_COOKIE_NAME}=${token}; HttpOnly; Path=${PREVIEW_SESSION_ACCESS_COOKIE_PATH}; SameSite=${sameSite};${secureAttribute(secure)}`;
}

export function buildPreviewRefreshCookie(
  token: string,
  sameSite: string,
  secure: boolean,
): string {
  return `${PREVIEW_SESSION_REFRESH_COOKIE_NAME}=${token}; HttpOnly; Path=${PREVIEW_SESSION_REFRESH_COOKIE_PATH}; SameSite=${sameSite};${secureAttribute(secure)}`;
}
