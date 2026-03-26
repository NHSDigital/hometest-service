import { z } from "zod";

import type { ValidationMessages } from "@/content";

const UK_MOBILE_REGEX = /^(?:(?:\+44|0044|44)7\d{9,13}|07\d{9,13})$/;

export const createMobileNumberSchema = (validationMessages: ValidationMessages) =>
  z
    .string()
    .trim()
    .min(1, { message: validationMessages.mobileNumber.invalid })
    .transform((val) => val.replaceAll(/[()\s-]/g, ""))
    .refine((val) => /^\+?\d+$/.test(val), {
      message: validationMessages.mobileNumber.invalid,
    })
    .refine((val) => val.replaceAll(/\D/g, "").length <= 15, {
      message: validationMessages.mobileNumber.invalid,
    })
    .refine((val) => UK_MOBILE_REGEX.test(val), {
      message: validationMessages.mobileNumber.invalid,
    });
