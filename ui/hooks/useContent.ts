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
  [PageKeys.GetSelfTest]: StartPageContent;
  [PageKeys.EnterDeliveryAddress]: EnterDeliveryAddressContent;
  [PageKeys.EnterAddressManually]: EnterAddressManuallyContent;
  [PageKeys.NoAddressFound]: NoAddressFoundContent;
  [PageKeys.SelectDeliveryAddress]: SelectDeliveryAddressContent;
  [PageKeys.ComfortablePricking]: HowComfortablePrickingFingerContent;
  [PageKeys.BloodSampleGuide]: BloodSampleGuideContent;
  [PageKeys.GlobalError]: GlobalErrorContent;
  [PageKeys.OrderTracking]: OrderTrackingContent;
  [PageKeys.HomeTestPolicy]: HomeTestPrivacyPolicyContent;
}

export const useContent = (): UseContentReturn => {
  return {
    commonContent: content.commonContent,
    [PageKeys.GetSelfTest]: content.pages[PageKeys.GetSelfTest],
    [PageKeys.EnterDeliveryAddress]: content.pages[PageKeys.EnterDeliveryAddress],
    [PageKeys.EnterAddressManually]: content.pages[PageKeys.EnterAddressManually],
    [PageKeys.NoAddressFound]: content.pages[PageKeys.NoAddressFound],
    [PageKeys.SelectDeliveryAddress]: content.pages[PageKeys.SelectDeliveryAddress],
    [PageKeys.ComfortablePricking]: content.pages[PageKeys.ComfortablePricking],
    [PageKeys.GlobalError]: content.pages[PageKeys.GlobalError],
    [PageKeys.OrderTracking]: content.pages[PageKeys.OrderTracking],
    [PageKeys.HomeTestPolicy]: content.pages[PageKeys.HomeTestPolicy],
    [PageKeys.BloodSampleGuide]: content.pages[PageKeys.BloodSampleGuide],
  };
};

export const useCommonContent = (): CommonContent => {
  return content.commonContent;
};

export function usePageContent(page: typeof PageKeys.GetSelfTest): StartPageContent;
export function usePageContent(page: typeof PageKeys.EnterDeliveryAddress): EnterDeliveryAddressContent;
export function usePageContent(page: typeof PageKeys.EnterAddressManually): EnterAddressManuallyContent;
export function usePageContent(page: typeof PageKeys.NoAddressFound): NoAddressFoundContent;
export function usePageContent(page: typeof PageKeys.SelectDeliveryAddress): SelectDeliveryAddressContent;
export function usePageContent(page: typeof PageKeys.ComfortablePricking): HowComfortablePrickingFingerContent;
export function usePageContent(page: typeof PageKeys.GlobalError): GlobalErrorContent;
export function usePageContent(page: typeof PageKeys.OrderTracking): OrderTrackingContent;
export function usePageContent(page: typeof PageKeys.HomeTestPolicy): HomeTestPrivacyPolicyContent;
export function usePageContent(page: typeof PageKeys.BloodSampleGuide): BloodSampleGuideContent;
export function usePageContent(page: PageKey) {
  return content.pages[page];
}

export default useContent;
