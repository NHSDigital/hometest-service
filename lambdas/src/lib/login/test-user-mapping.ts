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
