import { AuthUser } from "@/state/AuthContext";

/**
 * Test user first names lookup (temporary workaround for missing scope in NHS Login)
 * Maps family name (surname) to given name (first name) for known test users
 */
const TEST_FIRST_NAMES: Record<string, string> = {
  MILLAR: "Mona",
  HUGHES: "Iain",
  MEAKIN: "Mike",
  LEACH: "Kevin",
  OLLEY: "Arnold",
  LEECH: "Mina",
  CORR: "Lauren",
  BRAY: "Cassie Leona",
  GRIGG: "Kim",
  KEWN: "Emilie",
  CURRIE: "Amanda",
  BEARDSLEY: "TYRIQ",
  "BISSOON-LAL": "MISBAAH",
  RICK: "JULIE",
  WHONE: "JOHAN",
  "POWELL-CID": "Lee",
  EDELSTEIN: "GAVRIEL",
  TABERT: "ADELA",
  "BARKER-CID": "Gail",
  WRIGHT: "GARTH",
  ONIONS: "JULIET",
  PRYDE: "Toni",
  "KELSO-CID": "Huberto",
};

/**
 * Formats a user's display name, falling back to test user lookup if first name is missing
 * @param user - The authenticated user object
 * @returns Formatted display name (e.g., "John Smith" or just "Smith" if no first name)
 */
export function getDisplayName(user: AuthUser | null | undefined): string {
  if (!user) return "";

  if (user.givenName) {
    return `${user.givenName} ${user.familyName}`;
  }

  const testFirstName = TEST_FIRST_NAMES[user.familyName];
  if (testFirstName) {
    return `${testFirstName} ${user.familyName}`;
  }

  return user.familyName;
}
