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
  commonContent: CommonContent;
  "get-self-test-kit-for-HIV": StartPageContent;
  "enter-delivery-address": EnterDeliveryAddressContent;
  "enter-address-manually": EnterAddressManuallyContent;
  "no-address-found": NoAddressFoundContent;
  /** Select delivery address page content */
  "select-delivery-address": SelectDeliveryAddressContent;
  /** How comfortable pricking finger page content */
  "how-comfortable-pricking-finger": HowComfortablePrickingFingerContent;
}

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

export const useCommonContent = (): CommonContent => {
  return content.commonContent;
};

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
