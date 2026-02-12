/**
 * ContentService - Provides typed access to static content loaded at build time.
 *
 * This service imports the JSON content directly, ensuring it's bundled with
 * the application at build time. No runtime fetching occurs.
 *
 * The content is validated on import to ensure structural integrity.
 */

import type { ContentFile } from "./schema";
import { assertValidContent } from "./ContentValidator";
import contentData from "./content.json";

assertValidContent(contentData);

export const content: ContentFile = contentData as ContentFile;

export const getCommonContent = () => content.commonContent;

export const getPageContent = <K extends keyof ContentFile["pages"]>(
  pageName: K,
): ContentFile["pages"][K] => content.pages[pageName];

export default content;
