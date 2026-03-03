import type {
  BloodSampleGuideContent,
  CheckYourAnswersContent,
  CommonContent,
  ConfirmMobilePhoneNumberContent,
  EnterAddressManuallyContent,
  EnterDeliveryAddressContent,
  EnterMobilePhoneNumberContent,
  GlobalErrorContent,
  HomeTestPrivacyPolicyContent,
  HowComfortablePrickingFingerContent,
  NoAddressFoundContent,
  OrderTrackingContent,
  SelectDeliveryAddressContent,
  StartPageContent,
  TestResultsContent,
} from "@/content/schema";

import { content } from "@/content/ContentService";

export const PageKeys = {
  GetSelfTest: "get-self-test-kit-for-HIV",
  EnterDeliveryAddress: "enter-delivery-address",
  EnterAddressManually: "enter-address-manually",
  NoAddressFound: "no-address-found",
  SelectDeliveryAddress: "select-delivery-address",
  ComfortablePricking: "how-comfortable-pricking-finger",
  BloodSampleGuide: "blood-sample-guide",
  GlobalError: "global-error",
  OrderTracking: "order-tracking",
  HomeTestPolicy: "home-test-privacy-policy",
} as const;

export type PageKey = (typeof PageKeys)[keyof typeof PageKeys];

export interface UseContentReturn {
  commonContent: CommonContent;
  "get-self-test-kit-for-HIV": StartPageContent;
  "enter-delivery-address": EnterDeliveryAddressContent;
  "enter-address-manually": EnterAddressManuallyContent;
  "no-address-found": NoAddressFoundContent;
  "select-delivery-address": SelectDeliveryAddressContent;
  "how-comfortable-pricking-finger": HowComfortablePrickingFingerContent;
  "enter-mobile-phone-number": EnterMobilePhoneNumberContent;
  "check-your-answers": CheckYourAnswersContent;
  "confirm-mobile-phone-number": ConfirmMobilePhoneNumberContent;
  "blood-sample-guide": BloodSampleGuideContent;
  "global-error": GlobalErrorContent;
  "order-tracking": OrderTrackingContent;
  "test-results": TestResultsContent;
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
    "confirm-mobile-phone-number": content.pages["confirm-mobile-phone-number"],
    "enter-mobile-phone-number": content.pages["enter-mobile-phone-number"],
    "check-your-answers": content.pages["check-your-answers"],
    "global-error": content.pages["global-error"],
    "order-tracking": content.pages["order-tracking"],
    "test-results": content.pages["test-results"],
    "blood-sample-guide": content.pages["blood-sample-guide"],
    "home-test-privacy-policy": content.pages["home-test-privacy-policy"],
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
export function usePageContent(
  page: "enter-mobile-phone-number",
): EnterMobilePhoneNumberContent;
export function usePageContent(
  page: "confirm-mobile-phone-number",
): ConfirmMobilePhoneNumberContent;
export function usePageContent(page: "no-address-found"): NoAddressFoundContent;
export function usePageContent(
  page: "select-delivery-address",
): SelectDeliveryAddressContent;
export function usePageContent(
  page: "how-comfortable-pricking-finger",
): HowComfortablePrickingFingerContent;
export function usePageContent(page: "global-error"): GlobalErrorContent;
export function usePageContent(page: "order-tracking"): OrderTrackingContent;
export function usePageContent(
  page: "blood-sample-guide",
): BloodSampleGuideContent;
export function usePageContent(
  page: "check-your-answers",
): CheckYourAnswersContent;
export function usePageContent(page: "test-results"): TestResultsContent;
export function usePageContent(
  page: "home-test-privacy-policy",
): HomeTestPrivacyPolicyContent;
export function usePageContent(
  page:
    | "get-self-test-kit-for-HIV"
    | "enter-delivery-address"
    | "enter-address-manually"
    | "no-address-found"
    | "select-delivery-address"
    | "how-comfortable-pricking-finger"
    | "enter-mobile-phone-number"
    | "confirm-mobile-phone-number"
    | "global-error"
    | "order-tracking"
    | "blood-sample-guide"
    | "check-your-answers"
    | "test-results"
    | "home-test-privacy-policy",
) {
  return content.pages[page];
}

export default useContent;
