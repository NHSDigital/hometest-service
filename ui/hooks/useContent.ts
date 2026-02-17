import type {
  BloodSampleGuideContent,
  CommonContent,
  EnterAddressManuallyContent,
  EnterDeliveryAddressContent,
  GlobalErrorContent,
  HomeTestPrivacyPolicyContent,
  HowComfortablePrickingFingerContent,
  NoAddressFoundContent,
  OrderTrackingContent,
  SelectDeliveryAddressContent,
  StartPageContent,
} from "@/content/schema";

import { content } from "@/content/ContentService";

export interface UseContentReturn {
  commonContent: CommonContent;
  "get-self-test-kit-for-HIV": StartPageContent;
  "enter-delivery-address": EnterDeliveryAddressContent;
  "enter-address-manually": EnterAddressManuallyContent;
  "no-address-found": NoAddressFoundContent;
  "select-delivery-address": SelectDeliveryAddressContent;
  "how-comfortable-pricking-finger": HowComfortablePrickingFingerContent;
  "blood-sample-guide": BloodSampleGuideContent;
  "global-error": GlobalErrorContent;
  "order-tracking": OrderTrackingContent;
  "home-test-privacy-policy": HomeTestPrivacyPolicyContent;
}

export const useContent = (): UseContentReturn => {
  return {
    commonContent: content.commonContent,
    "get-self-test-kit-for-HIV": content.pages["get-self-test-kit-for-HIV"],
    "enter-delivery-address": content.pages["enter-delivery-address"],
    "enter-address-manually": content.pages["enter-address-manually"],
    "no-address-found": content.pages["no-address-found"],
    "select-delivery-address": content.pages["select-delivery-address"],
    "how-comfortable-pricking-finger":
      content.pages["how-comfortable-pricking-finger"],
    "global-error": content.pages["global-error"],
    "order-tracking": content.pages["order-tracking"],
    "home-test-privacy-policy": content.pages["home-test-privacy-policy"],
    "blood-sample-guide": content.pages["blood-sample-guide"],
  };
};

export const useCommonContent = (): CommonContent => {
  return content.commonContent;
};

export function usePageContent(
  page: "get-self-test-kit-for-HIV",
): StartPageContent;
export function usePageContent(
  page: "enter-delivery-address",
): EnterDeliveryAddressContent;
export function usePageContent(
  page: "enter-address-manually",
): EnterAddressManuallyContent;
export function usePageContent(page: "no-address-found"): NoAddressFoundContent;
export function usePageContent(
  page: "select-delivery-address",
): SelectDeliveryAddressContent;
export function usePageContent(
  page: "how-comfortable-pricking-finger",
): HowComfortablePrickingFingerContent;
export function usePageContent(page: "global-error"): GlobalErrorContent;
export function usePageContent(page: "order-tracking"): OrderTrackingContent;
export function usePageContent(page: "home-test-privacy-policy"): HomeTestPrivacyPolicyContent;
export function usePageContent(page: "blood-sample-guide"): BloodSampleGuideContent;
export function usePageContent(
  page:
    | "get-self-test-kit-for-HIV"
    | "enter-delivery-address"
    | "enter-address-manually"
    | "no-address-found"
    | "select-delivery-address"
    | "how-comfortable-pricking-finger"
    | "global-error"
    | "order-tracking"
    | "home-test-privacy-policy"
    | "blood-sample-guide"
) {
  return content.pages[page];
}

export default useContent;
