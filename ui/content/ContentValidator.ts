/**
 * ContentValidator - Validates content structure at build/initialization time.
 *
 * This validator ensures that the loaded content JSON conforms to the expected
 * structure defined in the schema. It provides early detection of missing or
 * malformed content during development.
 */

import type { ContentFile, CommonContent, PagesContent } from "./schema";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Required keys that must exist in commonContent.
 */
const REQUIRED_COMMON_KEYS: (keyof CommonContent)[] = [
  "navigation",
  "validation",
  "links",
  "errorSummary",
];

/**
 * Required keys that must exist in pages.
 */
const REQUIRED_PAGE_KEYS: (keyof PagesContent)[] = [
  "get-self-test-kit-for-HIV",
  "enter-delivery-address",
  "enter-address-manually",
  "no-address-found",
];

/**
 * Validates that a value is a non-null object.
 */
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Validates that a string property exists and is non-empty.
 */
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Validates the structure of commonContent.
 */
const validateCommonContent = (
  content: unknown,
  errors: string[]
): content is CommonContent => {
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

  // Validate navigation structure
  if (isObject(content.navigation)) {
    if (!isNonEmptyString(content.navigation.back)) {
      errors.push("commonContent.navigation.back must be a non-empty string");
    }
    if (!isNonEmptyString(content.navigation.continue)) {
      errors.push(
        "commonContent.navigation.continue must be a non-empty string"
      );
    }
  }

  return errors.length === 0;
};

/**
 * Validates the structure of pages content.
 */
const validatePagesContent = (
  content: unknown,
  errors: string[]
): content is PagesContent => {
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

  // Validate each page has a title
  for (const key of REQUIRED_PAGE_KEYS) {
    const page = content[key];
    if (isObject(page) && !isNonEmptyString(page.title)) {
      errors.push(`pages.${key}.title must be a non-empty string`);
    }
  }

  return errors.length === 0;
};

/**
 * Validates the entire content file structure.
 *
 * @param content - The content object to validate
 * @returns ValidationResult with valid flag and any error messages
 *
 * @example
 * ```ts
 * import { validateContent } from '@/content/ContentValidator';
 * import content from '@/content/content.json';
 *
 * const result = validateContent(content);
 * if (!result.valid) {
 *   console.error('Content validation failed:', result.errors);
 * }
 * ```
 */
export const validateContent = (content: unknown): ValidationResult => {
  const errors: string[] = [];

  if (!isObject(content)) {
    return {
      valid: false,
      errors: ["Content must be an object"],
    };
  }

  // Check top-level required keys
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

/**
 * Type guard to check if content is a valid ContentFile.
 */
export const isValidContentFile = (content: unknown): content is ContentFile => {
  const result = validateContent(content);
  return result.valid;
};

/**
 * Validates content and throws an error if invalid.
 * Useful for fail-fast validation during app initialization.
 *
 * @throws Error if content is invalid
 */
export const assertValidContent = (content: unknown): asserts content is ContentFile => {
  const result = validateContent(content);
  if (!result.valid) {
    throw new Error(
      `Content validation failed:\n${result.errors.map((e) => `  - ${e}`).join("\n")}`
    );
  }
};
