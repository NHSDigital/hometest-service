/**
 * ContentService - Provides typed access to static content loaded at build time.
 *
 * This service imports the JSON content directly, ensuring it's bundled with
 * the application at build time. No runtime fetching occurs.
 *
 * The content is validated on import to ensure structural integrity.
 */

import contentData from "./content.json";
import type { ContentFile } from "./schema";
import { assertValidContent } from "./ContentValidator";

// Validate content structure on module load
assertValidContent(contentData);

/**
 * The typed content object, loaded at build time.
 * This is a singleton - the same object is returned on every import.
 */
export const content: ContentFile = contentData as ContentFile;

/**
 * Helper function to get common content.
 * Provides a convenient shorthand for accessing frequently used content.
 */
export const getCommonContent = () => content.commonContent;

/**
 * Helper function to get page-specific content.
 * Provides type-safe access to individual page content.
 */
export const getPageContent = <K extends keyof ContentFile["pages"]>(
  pageName: K
): ContentFile["pages"][K] => content.pages[pageName];

/**
 * Default export for convenience.
 */
export default content;
