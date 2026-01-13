import * as test from "node:test";

export type ValidationResult = {
  valid: false
} | {
  valid: true,
  cleaned: string
}

/*
How in depth do we want to validate the postcode?

see https://en.wikipedia.org/wiki/Postcodes_in_the_United_Kingdom#Validation
Valid patterns are (where A signifies a letter and 9 a digit):
| outer | inner |
|-------|-------|
| AA9   | 9AA   |
| AA99  | 9AA   |
| A9    | 9AA   |
| A99   | 9AA   |
| A9A   | 9AA   |
| AA9A  | 9AA   |

There are more rules than this, specific letters can only go in specific spots, however that is probably overkill for our purposes.
The following regex should validate the format specified by the patterns above, but not that the postcode exists.
The inner code is simple, just a digit followed by 2 letters.
The outer code is more complex; it can have 1-2 letters, 1 digit, and an optional digit or letter.
The outer code and inner code are joined with a space.
To simplify, all letters must be uppercase.
*/
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
