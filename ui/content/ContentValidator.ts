/**
 * ContentValidator - Validates content structure at build/initialization time.
 *
 * This validator ensures that the loaded content JSON conforms to the expected
 * structure defined in the schema. It provides early detection of missing or
 * malformed content during development.
 */

import type { CommonContent, ContentFile, PagesContent } from "./schema";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const REQUIRED_COMMON_KEYS: (keyof CommonContent)[] = [
  "navigation",
  "validation",
  "links",
  "errorSummary",
  "orderStatus",
  "footer",
];

const REQUIRED_PAGE_KEYS: (keyof PagesContent)[] = [
  "get-self-test-kit-for-HIV",
  "enter-delivery-address",
  "enter-address-manually",
  "no-address-found",
  "select-delivery-address",
  "how-comfortable-pricking-finger",
  "enter-mobile-phone-number",
  "global-error",
  "order-tracking",
  "test-results",
  "blood-sample-guide",
  "home-test-privacy-policy",
  "suppliers-terms-conditions",
  "suppliers-privacy-policy",
];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validateCommonContent = (content: unknown, errors: string[]): content is CommonContent => {
  if (!isObject(content)) {
    errors.push("commonContent must be an object");
    return false;
  }

  for (const key of REQUIRED_COMMON_KEYS) {
    if (!(key in content)) {
      errors.push(`commonContent is missing required key: ${key}`);
    } else if (!isObject(content[key])) {
      errors.push(`commonContent.${key} must be an object`);
    }
  }

  if (isObject(content.navigation)) {
    if (!isNonEmptyString(content.navigation.back)) {
      errors.push("commonContent.navigation.back must be a non-empty string");
    }
    if (!isNonEmptyString(content.navigation.continue)) {
      errors.push("commonContent.navigation.continue must be a non-empty string");
    }
  }

  return errors.length === 0;
};

const validatePagesContent = (content: unknown, errors: string[]): content is PagesContent => {
  if (!isObject(content)) {
    errors.push("pages must be an object");
    return false;
  }

  for (const key of REQUIRED_PAGE_KEYS) {
    if (!(key in content)) {
      errors.push(`pages is missing required key: ${key}`);
    } else if (!isObject(content[key])) {
      errors.push(`pages.${key} must be an object`);
    }
  }

  for (const key of REQUIRED_PAGE_KEYS) {
    const page = content[key];
    if (isObject(page) && !isNonEmptyString(page.title)) {
      errors.push(`pages.${key}.title must be a non-empty string`);
    }
  }

  return errors.length === 0;
};

export const validateContent = (content: unknown): ValidationResult => {
  const errors: string[] = [];

  if (!isObject(content)) {
    return {
      valid: false,
      errors: ["Content must be an object"],
    };
  }

  if (!("commonContent" in content)) {
    errors.push("Content is missing required key: commonContent");
  } else {
    validateCommonContent(content.commonContent, errors);
  }

  if (!("pages" in content)) {
    errors.push("Content is missing required key: pages");
  } else {
    validatePagesContent(content.pages, errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const isValidContentFile = (content: unknown): content is ContentFile => {
  const result = validateContent(content);
  return result.valid;
};

export const assertValidContent: (content: unknown) => asserts content is ContentFile = (
  content,
) => {
  const result = validateContent(content);
  if (!result.valid) {
    throw new Error(
      `Content validation failed:\n${result.errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }
};
