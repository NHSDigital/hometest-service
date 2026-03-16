import { randomUUID } from "crypto";

/**
 * WireMock response template renderer.
 *
 * Supports the template helpers used in the existing stub mappings:
 *   {{randomValue type='UUID'}}
 *   {{now format='yyyy-MM-dd'}}
 *   {{now offset='-2 days' format='yyyy-MM-dd'}}
 */

export function renderTemplate(body: string): string {
  // {{randomValue type='UUID'}}
  body = body.replace(/\{\{randomValue\s+type='UUID'\}\}/g, () => randomUUID());

  // {{now ...}} with optional offset and format
  body = body.replace(
    /\{\{now(?:\s+offset='([^']*)')?\s*(?:format='([^']*)')?\}\}/g,
    (_match, offset?: string, format?: string) => {
      let date = new Date();

      if (offset) {
        date = applyOffset(date, offset);
      }

      if (format) {
        return formatDate(date, format);
      }

      return date.toISOString();
    },
  );

  return body;
}

function applyOffset(date: Date, offset: string): Date {
  const result = new Date(date);
  // Parse offsets like "-2 days", "+1 hours", "-30 minutes"
  const match = offset.match(/^([+-]?\d+)\s+(second|minute|hour|day|week|month|year)s?$/i);
  if (!match) return result;

  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "second":
      result.setSeconds(result.getSeconds() + amount);
      break;
    case "minute":
      result.setMinutes(result.getMinutes() + amount);
      break;
    case "hour":
      result.setHours(result.getHours() + amount);
      break;
    case "day":
      result.setDate(result.getDate() + amount);
      break;
    case "week":
      result.setDate(result.getDate() + amount * 7);
      break;
    case "month":
      result.setMonth(result.getMonth() + amount);
      break;
    case "year":
      result.setFullYear(result.getFullYear() + amount);
      break;
  }

  return result;
}

/**
 * Simplified Java SimpleDateFormat → JS date formatter.
 * Covers the patterns used in WireMock stubs.
 */
function formatDate(date: Date, format: string): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");

  return format
    .replace(/yyyy/g, String(date.getFullYear()))
    .replace(/MM/g, pad(date.getMonth() + 1))
    .replace(/dd/g, pad(date.getDate()))
    .replace(/HH/g, pad(date.getHours()))
    .replace(/mm/g, pad(date.getMinutes()))
    .replace(/ss/g, pad(date.getSeconds()));
}
