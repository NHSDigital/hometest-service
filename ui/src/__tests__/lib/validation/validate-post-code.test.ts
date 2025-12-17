import validatePostCode, {
  PostCodeValidationResult
} from '../../../lib/validation/validate-post-code';

describe('validatePostCode', () => {
  it('returns EMPTY for an empty string', () => {
    expect(validatePostCode('')).toBe(PostCodeValidationResult.EMPTY);
  });

  it('returns PARTIAL for a partial UK postcode', () => {
    expect(validatePostCode('SW1A')).toBe(PostCodeValidationResult.PARTIAL);
  });

  it('returns INVALID for an invalid UK postcode', () => {
    expect(validatePostCode('INVALID')).toBe(PostCodeValidationResult.INVALID);
  });

  it('returns VALID for a valid UK postcode', () => {
    expect(validatePostCode('SW1A 1AA')).toBe(PostCodeValidationResult.VALID);
  });

  it('returns VALID for a postcode with extra whitespace', () => {
    expect(validatePostCode(' SW1A  1AA ')).toBe(
      PostCodeValidationResult.VALID
    );
  });

  it('returns VALID for a postcode in lowercase', () => {
    expect(validatePostCode('sw1a 1aa')).toBe(PostCodeValidationResult.VALID);
  });

  it('returns VALID for a special postcode like GIR 0AA', () => {
    expect(validatePostCode('GIR 0AA')).toBe(PostCodeValidationResult.VALID);
  });

  it('returns PARTIAL for a special partial postcode like GIR', () => {
    expect(validatePostCode('GIR')).toBe(PostCodeValidationResult.PARTIAL);
  });
});
