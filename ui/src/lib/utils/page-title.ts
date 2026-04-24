export const SERVICE_NAME = "HIV Home Test Service – NHS";

export const DEFAULT_PAGE_TITLE = SERVICE_NAME;

export function formatPageTitle(pageName: string): string {
  return `${pageName} – ${SERVICE_NAME}`;
}
