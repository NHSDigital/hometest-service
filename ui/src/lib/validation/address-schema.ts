import { z } from "zod";

import type { ValidationMessages } from "@/content";

const POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
const ADDRESS_LINE_REQUIRED_REGEX = /^[a-zA-Z0-9\s\-,./&#'"()]+$/;
const ADDRESS_LINE_OPTIONAL_REGEX = /^[a-zA-Z0-9\s\-,./&#'"()]*$/;
const MAX_POSTCODE_LENGTH = 8;
const MAX_ADDRESS_LINE_LENGTH = 100;
const MAX_TOWN_LENGTH = 100;
const MAX_BUILDING_NAME_LENGTH = 100;

interface AddressLineValidationMessages {
  maxLength: string;
  invalid: string;
  required?: string;
}

const createAddressLineSchema = (
  validationMessages: AddressLineValidationMessages,
  isRequired: boolean,
) => {
  const baseSchema =
    isRequired && validationMessages.required
      ? z.string().trim().min(1, { message: validationMessages.required })
      : z.string().trim();

  const regex = isRequired ? ADDRESS_LINE_REQUIRED_REGEX : ADDRESS_LINE_OPTIONAL_REGEX;

  return baseSchema
    .max(MAX_ADDRESS_LINE_LENGTH, { message: validationMessages.maxLength })
    .refine((val) => regex.test(val), {
      message: validationMessages.invalid,
    });
};

export const createAddressSchema = (validationMessages: ValidationMessages) =>
  z.object({
    addressLine1: createAddressLine1Schema(validationMessages),
    addressLine2: createAddressLine2Schema(validationMessages),
    addressLine3: createAddressLine3Schema(validationMessages),
    townOrCity: createTownSchema(validationMessages),
    postcode: createPostcodeSchema(validationMessages),
  });

export const createAddressLine1Schema = (validationMessages: ValidationMessages) =>
  createAddressLineSchema(validationMessages.addressLine1, true);

export const createAddressLine2Schema = (validationMessages: ValidationMessages) =>
  createAddressLineSchema(validationMessages.addressLine2, false);

export const createAddressLine3Schema = (validationMessages: ValidationMessages) =>
  createAddressLineSchema(validationMessages.addressLine3, false);

export const createTownSchema = (validationMessages: ValidationMessages) =>
  z
    .string()
    .trim()
    .min(1, { message: validationMessages.townOrCity.required })
    .max(MAX_TOWN_LENGTH, { message: validationMessages.townOrCity.maxLength })
    .refine((val) => /^[A-Za-z\s'.-]+$/.test(val), {
      message: validationMessages.townOrCity.invalid,
    });

export const createBuildingNameSchema = (validationMessages: ValidationMessages) =>
  z
    .string()
    .trim()
    .max(MAX_BUILDING_NAME_LENGTH, { message: validationMessages.buildingName.maxLength });

export const createPostcodeSchema = (validationMessages: ValidationMessages) =>
  z
    .string()
    .trim()
    .min(1, { message: validationMessages.postcode.required })
    .max(MAX_POSTCODE_LENGTH, { message: validationMessages.postcode.maxLength })
    .transform((val) => val.toUpperCase())
    .refine((val) => POSTCODE_REGEX.test(val), {
      message: validationMessages.postcode.invalid,
    });
