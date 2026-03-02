import type {
  BloodSampleGuideContent,
  CheckYourAnswersContent,
  CommonContent,
  ConfirmMobilePhoneNumberContent,
  EnterAddressManuallyContent,
  EnterDeliveryAddressContent,
  EnterMobilePhoneNumberContent,
  ServiceErrorContent,
  HomeTestPrivacyPolicyContent,
  HowComfortablePrickingFingerContent,
  KitNotAvailableInAreaContent,
  NoAddressFoundContent,
  OrderSubmittedContent,
  OrderTrackingContent,
  SelectDeliveryAddressContent,
  StartPageContent,
  SuppliersLegalDocumentsContent,
  TestResultsContent,
} from "@/content/schema";

import { content } from "@/content/ContentService";

export const PageKeys = {
  GetSelfTest: "get-self-test-kit-for-HIV",
  KitNotAvailableInArea: "kit-not-available-in-area",
  EnterDeliveryAddress: "enter-delivery-address",
  EnterAddressManually: "enter-address-manually",
  NoAddressFound: "no-address-found",
  SelectDeliveryAddress: "select-delivery-address",
  ComfortablePricking: "how-comfortable-pricking-finger",
  BloodSampleGuide: "blood-sample-guide",
  ServiceError: "service-error",
  OrderTracking: "order-tracking",
  HomeTestPolicy: "home-test-privacy-policy",
  SuppliersTermsConditions: "suppliers-terms-conditions",
  SuppliersPrivacyPolicy: "suppliers-privacy-policy",
} as const;

export type PageKey = (typeof PageKeys)[keyof typeof PageKeys];

export interface UseContentReturn {
  commonContent: CommonContent;
  "get-self-test-kit-for-HIV": StartPageContent;
  "kit-not-available-in-area": KitNotAvailableInAreaContent;
  "enter-delivery-address": EnterDeliveryAddressContent;
  "enter-address-manually": EnterAddressManuallyContent;
  "no-address-found": NoAddressFoundContent;
  "select-delivery-address": SelectDeliveryAddressContent;
  "how-comfortable-pricking-finger": HowComfortablePrickingFingerContent;
  "enter-mobile-phone-number": EnterMobilePhoneNumberContent;
  "check-your-answers": CheckYourAnswersContent;
  "confirm-mobile-phone-number": ConfirmMobilePhoneNumberContent;
  "blood-sample-guide": BloodSampleGuideContent;
  "service-error": ServiceErrorContent;
  "order-tracking": OrderTrackingContent;
  "test-results": TestResultsContent;
  "home-test-privacy-policy": HomeTestPrivacyPolicyContent;
  "order-submitted": OrderSubmittedContent;
  "suppliers-terms-conditions": SuppliersLegalDocumentsContent;
  "suppliers-privacy-policy": SuppliersLegalDocumentsContent;
}

export const useContent = (): UseContentReturn => {
  return {
    commonContent: content.commonContent,
    "get-self-test-kit-for-HIV": content.pages["get-self-test-kit-for-HIV"],
    "kit-not-available-in-area": content.pages["kit-not-available-in-area"],
    "enter-delivery-address": content.pages["enter-delivery-address"],
    "enter-address-manually": content.pages["enter-address-manually"],
    "no-address-found": content.pages["no-address-found"],
    "select-delivery-address": content.pages["select-delivery-address"],
    "how-comfortable-pricking-finger": content.pages["how-comfortable-pricking-finger"],
    "confirm-mobile-phone-number": content.pages["confirm-mobile-phone-number"],
    "enter-mobile-phone-number": content.pages["enter-mobile-phone-number"],
    "check-your-answers": content.pages["check-your-answers"],
    "service-error": content.pages["service-error"],
    "order-tracking": content.pages["order-tracking"],
    "test-results": content.pages["test-results"],
    "blood-sample-guide": content.pages["blood-sample-guide"],
    "home-test-privacy-policy": content.pages["home-test-privacy-policy"],
    "order-submitted": content.pages["order-submitted"],
    "suppliers-terms-conditions": content.pages["suppliers-terms-conditions"],
    "suppliers-privacy-policy": content.pages["suppliers-privacy-policy"],
  };
};

export const useCommonContent = (): CommonContent => {
  return content.commonContent;
};

type PageContentKey = Exclude<keyof UseContentReturn, "commonContent">;

export function usePageContent<K extends PageContentKey>(page: K): UseContentReturn[K] {
  return content.pages[page] as UseContentReturn[K];
}

export default useContent;
