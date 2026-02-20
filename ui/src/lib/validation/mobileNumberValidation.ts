import { z } from "zod";
import type { ValidationMessages } from "@/content/schema";

export const UK_MOBILE_REGEX = /^(?:(?:\+44|0044|44)7\d{9}|07\d{9})$/;

export const createMobileNumberSchema = (validationMessages: ValidationMessages) =>
  z
    .string()
    .trim()
    .min(1, { message: validationMessages.mobileNumber.required })
    .transform((val) => val.replace(/[()\s-]/g, ""))
    .refine((val) => /^\+?\d+$/.test(val), {
      message: validationMessages.mobileNumber.invalid,
    })
    .refine((val) => val.replace(/\D/g, "").length <= 15, {
      message: validationMessages.mobileNumber.invalid,
    })
    .refine((val) => UK_MOBILE_REGEX.test(val), {
      message: validationMessages.mobileNumber.invalid,
    });

export const validateMobileNumber = (
  mobileNumber: string,
  validationMessages: ValidationMessages
): { valid: true; value: string } | { valid: false; message: string } => {
  const schema = createMobileNumberSchema(validationMessages);
  const result = schema.safeParse(mobileNumber);

  if (result.success) {
    return { valid: true, value: result.data };
  }

  return { valid: false, message: result.error.issues[0].message };
};
