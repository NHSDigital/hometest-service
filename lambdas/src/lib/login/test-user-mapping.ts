import { type INhsUserInfoResponseModel } from '../models/nhs-login/nhs-login-user-info-response-model';

/**
 * Test user first names lookup (temporary workaround for missing scope in NHS Login)
 * Maps family name (surname) to given name (first name) for known test users
 * TODO: Remove this when the given_name (profile_extended) scope is available from NHS Login
 */
export const TEST_FIRST_NAMES: Record<string, string> = {
  MILLAR: 'Mona',
  HUGHES: 'Iain',
  MEAKIN: 'Mike',
  LEACH: 'Kevin',
  OLLEY: 'Arnold',
  LEECH: 'Mina',
  CORR: 'Lauren',
  BRAY: 'Cassie Leona',
  GRIGG: 'Kim',
  KEWN: 'Emilie',
  CURRIE: 'Amanda',
  BEARDSLEY: 'TYRIQ',
  'BISSOON-LAL': 'MISBAAH',
  RICK: 'JULIE',
  WHONE: 'JOHAN',
  'POWELL-CID': 'Lee',
  EDELSTEIN: 'GAVRIEL',
  TABERT: 'ADELA',
  'BARKER-CID': 'Gail',
  WRIGHT: 'GARTH',
  ONIONS: 'JULIET',
  PRYDE: 'Toni',
  'KELSO-CID': 'Huberto',
};

/**
 * Enriches user info with test first names for known test users (temporary workaround)
 * Fills in missing given_name based on family_name lookup
 * ALPHA: TODO: Remove this when the given_name (profile_extended) scope is available from NHS Login
 * @param userInfo - The user info response from NHS Login
 * @returns Enriched user info with given_name populated if missing
 */
export function enrichUserInfoWithTestFirstName(
  userInfo: INhsUserInfoResponseModel
): INhsUserInfoResponseModel {
  if (userInfo.given_name) {
    return userInfo;
  }

  const testFirstName = TEST_FIRST_NAMES[userInfo.family_name];
  if (testFirstName) {
    return { ...userInfo, given_name: testFirstName };
  }

  return userInfo;
}
