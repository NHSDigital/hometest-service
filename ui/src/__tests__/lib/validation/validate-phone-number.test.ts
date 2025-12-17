import validatePhoneNumber, {
  PhoneNumberValidationResult
} from '../../../lib/validation/validate-phone-number';

describe('validatePhoneNumber', () => {
  it('returns EMPTY for an empty string', () => {
    expect(validatePhoneNumber('')).toBe(PhoneNumberValidationResult.EMPTY);
  });

  it('returns INVALID for an invalid UK phone number', () => {
    expect(validatePhoneNumber('INVALID')).toBe(
      PhoneNumberValidationResult.INVALID
    );
  });
  it('returns INVALID for an invalid UK phone number (too long)', () => {
    expect(validatePhoneNumber('077009000000')).toBe(
      PhoneNumberValidationResult.INVALID
    );
  });
  it('returns INVALID for an invalid UK phone number (too short)', () => {
    expect(validatePhoneNumber('07700900')).toBe(
      PhoneNumberValidationResult.INVALID
    );
  });
  it('returns INVALID for an invalid UK phone number (incorrect prefix)', () => {
    expect(validatePhoneNumber('08700900000')).toBe(
      PhoneNumberValidationResult.INVALID
    );
  });
  it('returns VALID for a valid UK phone number starting 07', () => {
    expect(validatePhoneNumber('07700900000')).toBe(
      PhoneNumberValidationResult.VALID
    );
  });

  it('returns VALID for a valid UK phone number starting +44', () => {
    expect(validatePhoneNumber('+447700900000')).toBe(
      PhoneNumberValidationResult.VALID
    );
  });

  it('returns VALID for a valid UK phone number starting 0044', () => {
    expect(validatePhoneNumber('00447700900000')).toBe(
      PhoneNumberValidationResult.VALID
    );
  });

  it('returns VALID for a phone number with extra whitespace', () => {
    expect(validatePhoneNumber(' 07700900000 ')).toBe(
      PhoneNumberValidationResult.VALID
    );
  });

  it('returns VALID for a phone number with letters', () => {
    expect(validatePhoneNumber('AAAAA')).toBe(
      PhoneNumberValidationResult.INVALID
    );
  });
});
