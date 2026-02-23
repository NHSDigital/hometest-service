export type ValidationResult = {
  valid: false
} | {
  valid: true,
  cleaned: string
}

const POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/

export function validatePostcodeFormat(postcode: string): ValidationResult {
  // normalise
  const normalised: string = postcode.toUpperCase().replace(/\s+/g, '');

  // a normalised postcode should be 5-7 characters long
  if (normalised.length < 5 || normalised.length > 7) {
    return {valid: false};
  }

  // a valid postcode format ends in 3 chars, so we will split on that
  const innerCode = normalised.slice(-3);
  const outerCode = normalised.slice(0, -3);
  const formattedPostcode = `${outerCode} ${innerCode}`;

  if (!POSTCODE_REGEX.test(formattedPostcode)) {
    return {valid: false};
  }

  return {valid: true, cleaned: formattedPostcode};
}
