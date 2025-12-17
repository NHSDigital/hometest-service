export enum PhoneNumberValidationResult {
  VALID = 'VALID',
  EMPTY = 'EMPTY',
  INVALID = 'INVALID'
}

export function normalisePhoneNumber(phoneNumber: string): string {
  const WHITESPACE = /\s/g;
  const SPECIAL_CHARACTERS = /[()-+]/g;

  return phoneNumber.replace(WHITESPACE, '').replace(SPECIAL_CHARACTERS, '');
}

function isUKPhoneNumber(phoneNumber: string): boolean {
  const UK_PREFIX = '+44';

  return (
    phoneNumber.startsWith(UK_PREFIX) ||
    phoneNumber.startsWith('07') ||
    phoneNumber.startsWith('0044')
  );
}
function removePrefix(phoneNumber: string): string {
  const UK_PREFIX = '44';
  phoneNumber = normalisePhoneNumber(phoneNumber).replace(
    new RegExp(`^(${UK_PREFIX}|0044|0)`),
    ''
  );
  return phoneNumber;
}
export default function validateUKPhoneNumber(
  phoneNumber?: string
): PhoneNumberValidationResult {
  if (!phoneNumber || phoneNumber === '') {
    return PhoneNumberValidationResult.EMPTY;
  }

  phoneNumber = phoneNumber.trim();

  if (!isUKPhoneNumber(phoneNumber)) {
    return PhoneNumberValidationResult.INVALID;
  }
  phoneNumber = removePrefix(phoneNumber);

  if (
    !phoneNumber.startsWith('7') ||
    phoneNumber.length !== 10 ||
    !/^\d+$/.test(phoneNumber)
  ) {
    return PhoneNumberValidationResult.INVALID;
  }

  return PhoneNumberValidationResult.VALID;
}

export function formatPhoneNumber(phoneNumber: string): string {
  phoneNumber = phoneNumber.trim();
  if (phoneNumber.startsWith('+')) {
    phoneNumber = phoneNumber.slice(3);
  }
  if (phoneNumber.startsWith('0044')) {
    phoneNumber = phoneNumber.slice(4);
  } else if (phoneNumber.startsWith('07')) {
    phoneNumber = phoneNumber.slice(1);
  }
  phoneNumber = normalisePhoneNumber(phoneNumber);
  phoneNumber = '0' + phoneNumber;
  return phoneNumber;
}
