/**
 * useContent - React hook for accessing typed CMS content.
 *
 * This hook provides convenient access to the build-time loaded content
 * with full TypeScript support.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { commonContent, start } = useContent();
 *
 *   return (
 *     <div>
 *       <h1>{start.title}</h1>
 *       <button>{commonContent.navigation.continue}</button>
 *     </div>
 *   );
 * }
 * ```
 */

import { content } from "@/content/ContentService";
import type {
  CommonContent,
  StartPageContent,
  EnterDeliveryAddressContent,
  EnterAddressManuallyContent,
  NoAddressFoundContent,
  SelectDeliveryAddressContent,
  HowComfortablePrickingFingerContent,
} from "@/content/schema";

export interface UseContentReturn {
  /** Common content shared across all pages (navigation, validation, links) */
  commonContent: CommonContent;
  /** Start page content (get-self-test-kit-for-HIV) */
  "get-self-test-kit-for-HIV": StartPageContent;
  /** Enter delivery address page content */
  "enter-delivery-address": EnterDeliveryAddressContent;
  /** Enter address manually page content */
  "enter-address-manually": EnterAddressManuallyContent;
  /** No address found page content */
  "no-address-found": NoAddressFoundContent;
  /** Select delivery address page content */
  "select-delivery-address": SelectDeliveryAddressContent;
  /** How comfortable pricking finger page content */
  "how-comfortable-pricking-finger": HowComfortablePrickingFingerContent;
}

/**
 * Hook to access typed CMS content.
 *
 * Returns all content sections with full TypeScript typing.
 * Content is loaded at build time - no runtime fetching occurs.
 *
 * @returns Object containing all content sections
 */
export const useContent = (): UseContentReturn => {
  return {
    commonContent: content.commonContent,
    "get-self-test-kit-for-HIV": content.pages["get-self-test-kit-for-HIV"],
    "enter-delivery-address": content.pages["enter-delivery-address"],
    "enter-address-manually": content.pages["enter-address-manually"],
    "no-address-found": content.pages["no-address-found"],
    "select-delivery-address": content.pages["select-delivery-address"],
    "how-comfortable-pricking-finger": content.pages["how-comfortable-pricking-finger"],
  };
};

/**
 * Hook to access only common content.
 * Useful when you only need navigation, validation messages, or links.
 */
export const useCommonContent = (): CommonContent => {
  return content.commonContent;
};

/**
 * Hook to access a specific page's content.
 *
 * @example
 * ```tsx
 * const startContent = usePageContent('start');
 * console.log(startContent.title); // "Get a self-test kit for HIV"
 * ```
 */
export function usePageContent(page: "get-self-test-kit-for-HIV"): StartPageContent;
export function usePageContent(page: "enter-delivery-address"): EnterDeliveryAddressContent;
export function usePageContent(page: "enter-address-manually"): EnterAddressManuallyContent;
export function usePageContent(page: "no-address-found"): NoAddressFoundContent;
export function usePageContent(page: "select-delivery-address"): SelectDeliveryAddressContent;
export function usePageContent(page: "how-comfortable-pricking-finger"): HowComfortablePrickingFingerContent;
export function usePageContent(
  page: "get-self-test-kit-for-HIV" | "enter-delivery-address" | "enter-address-manually" | "no-address-found" | "select-delivery-address" | "how-comfortable-pricking-finger"
) {
  return content.pages[page];
}

export default useContent;
