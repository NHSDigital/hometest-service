import contentData from "./content.json";
import type { ContentFile } from "./schema";
import { assertValidContent } from "./ContentValidator";

assertValidContent(contentData);

export const content: ContentFile = contentData as ContentFile;

export const getCommonContent = () => content.commonContent;

export const getPageContent = <K extends keyof ContentFile["pages"]>(
  pageName: K
): ContentFile["pages"][K] => content.pages[pageName];

export default content;
