// Postcode validation adapted from GOV.UK Notify from https://github.com/alphagov/notifications-utils/blob/3a2845658cccea9c76820232fc52f35e4faab871/notifications_utils/recipient_validation/postal_address.py#L230-L234

// https://github.com/alphagov/notifications-utils/blob/3a2845658cccea9c76820232fc52f35e4faab871/notifications_utils/countries/_data/uk-postcode-zones.txt
const UK_POSTCODE_ZONES = [
  'AB',
  'AL',
  'B',
  'BA',
  'BB',
  'BD',
  'BF',
  'BH',
  'BL',
  'BN',
  'BR',
  'BS',
  'BT',
  'BX',
  'CA',
  'CB',
  'CF',
  'CH',
  'CM',
  'CO',
  'CR',
  'CT',
  'CV',
  'CW',
  'DA',
  'DD',
  'DE',
  'DG',
  'DH',
  'DL',
  'DN',
  'DT',
  'DY',
  'E',
  'EC',
  'EH',
  'EN',
  'EX',
  'FK',
  'FY',
  'G',
  'GL',
  'GU',
  'GY',
  'HA',
  'HD',
  'HG',
  'HP',
  'HR',
  'HS',
  'HU',
  'HX',
  'IG',
  'IM',
  'IP',
  'IV',
  'JE',
  'KA',
  'KT',
  'KW',
  'KY',
  'L',
  'GIR',
  'LA',
  'LD',
  'LE',
  'LL',
  'LN',
  'LS',
  'LU',
  'M',
  'ME',
  'MK',
  'ML',
  'N',
  'NE',
  'NG',
  'NN',
  'NP',
  'NR',
  'NW',
  'OL',
  'OX',
  'PA',
  'PE',
  'PH',
  'PL',
  'PO',
  'PR',
  'RG',
  'RH',
  'RM',
  'S',
  'SA',
  'SE',
  'SG',
  'SK',
  'SL',
  'SM',
  'SN',
  'SO',
  'SP',
  'SR',
  'SS',
  'ST',
  'SW',
  'SY',
  'TA',
  'TD',
  'TF',
  'TN',
  'TQ',
  'TR',
  'TS',
  'TW',
  'UB',
  'W',
  'WA',
  'WC',
  'WD',
  'WF',
  'WN',
  'WR',
  'WS',
  'WV',
  'YO',
  'ZE'
];

export enum PostCodeValidationResult {
  VALID = 'VALID',
  EMPTY = 'EMPTY',
  PARTIAL = 'PARTIAL',
  INVALID = 'INVALID'
}

export default function validatePostCode(
  postcode: string
): PostCodeValidationResult {
  if (postcode === '') {
    return PostCodeValidationResult.EMPTY;
  }
  if (isPartialUkPostcode(postcode)) {
    return PostCodeValidationResult.PARTIAL;
  }
  if (!isARealUkPostcode(postcode)) {
    return PostCodeValidationResult.INVALID;
  }
  return PostCodeValidationResult.VALID;
}

export function normalisePostcode(postcode: string): string {
  const cleaned = postcode.replaceAll(/\s+/g, '').toUpperCase();
  if (cleaned === 'GIR0AA') return 'GIR 0AA'; // Special case exception
  const parts = new RegExp(
    /^([A-Z]{1,2}\d[0-9A-Z]?)(\d[ABD-HJLNP-UW-Z]{2})$/
  ).exec(cleaned);
  return parts ? `${parts[1]} ${parts[2]}` : cleaned;
}

function isARealUkPostcode(postcode: string) {
  const normalised = normalisePostcode(postcode);
  const pattern = new RegExp(
    `^(${UK_POSTCODE_ZONES.join('|')})[0-9][0-9A-Z]? [0-9][ABD-HJLNP-UW-Z]{2}$|^GIR 0AA$`
  );
  return pattern.test(normalised);
}

function isPartialUkPostcode(postcode: string) {
  const normalised = normalisePostcode(postcode);
  const partialPattern = new RegExp(
    `^(${UK_POSTCODE_ZONES.join('|')})[0-9]?[0-9A-Z]?$|^GIR?$`
  );
  return partialPattern.test(normalised) && !isARealUkPostcode(postcode);
}
