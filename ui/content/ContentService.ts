/**
 * ContentService - Provides typed access to static content loaded at build time.
 *
 * This service imports the JSON content directly, ensuring it's bundled with
 * the application at build time. No runtime fetching occurs.
 *
 * The content is validated on import to ensure structural integrity.
 */

import type { ContentFile, HomeTestPrivacyPolicyContent, HomeTestTermsOfUseContent } from "./schema";
import { assertValidContent } from "./ContentValidator";
import contentData from "./content.json";
import privacyPolicyData from "./hometest-privacy-policy.json";
import termsOfUseData from "./hometest-terms-of-use.json";

assertValidContent(contentData);

export const content: ContentFile = {
  commonContent: contentData.commonContent,
  pages: {
    ...contentData.pages,
    "home-test-privacy-policy": privacyPolicyData as HomeTestPrivacyPolicyContent,
    "home-test-terms-of-use": termsOfUseData as HomeTestTermsOfUseContent,
  },
};

export const getCommonContent = () => content.commonContent;

export const getPageContent = <K extends keyof ContentFile["pages"]>(
  pageName: K,
): ContentFile["pages"][K] => content.pages[pageName];

export default content;
