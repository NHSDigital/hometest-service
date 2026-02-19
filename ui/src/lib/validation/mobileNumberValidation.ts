import type { ValidationMessages } from "@/content/schema";

export const UK_MOBILE_REGEX = /^(?:(?:\+44|0044|44)7\d{9}|07\d{9})$/;

export const validateMobileNumber = (
  mobileNumber: string,
  validationMessages: ValidationMessages
): { valid: true; value: string } | { valid: false; message: string } => {
  if (!mobileNumber || mobileNumber.trim() === "") {
    return { valid: false, message: validationMessages.mobileNumber.required };
  }

  const trimmedNumber = mobileNumber.trim();
  const normalisedNumber = trimmedNumber.replace(/[()\s-]/g, "");

  if (!/^\+?\d+$/.test(normalisedNumber)) {
    return { valid: false, message: validationMessages.mobileNumber.invalid };
  }

  const digitCount = normalisedNumber.replace(/\D/g, "").length;
  if (digitCount > 15) {
    return { valid: false, message: validationMessages.mobileNumber.invalid };
  }

  if (!UK_MOBILE_REGEX.test(normalisedNumber)) {
    return { valid: false, message: validationMessages.mobileNumber.invalid };
  }

  return { valid: true, value: normalisedNumber };
};
