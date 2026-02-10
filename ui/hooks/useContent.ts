import { content } from "@/content/ContentService";
import type {
  CommonContent,
  StartPageContent,
  EnterDeliveryAddressContent,
  EnterAddressManuallyContent,
  NoAddressFoundContent,
  SelectDeliveryAddressContent,
  GlobalErrorContent,
  OrderTrackingContent,
} from "@/content/schema";

export interface UseContentReturn {
  commonContent: CommonContent;
  "get-self-test-kit-for-HIV": StartPageContent;
  "enter-delivery-address": EnterDeliveryAddressContent;
  "enter-address-manually": EnterAddressManuallyContent;
  "no-address-found": NoAddressFoundContent;
  "select-delivery-address": SelectDeliveryAddressContent;
  "global-error": GlobalErrorContent;
  "order-tracking": OrderTrackingContent;
}

export const useContent = (): UseContentReturn => {
  return {
    commonContent: content.commonContent,
    "get-self-test-kit-for-HIV": content.pages["get-self-test-kit-for-HIV"],
    "enter-delivery-address": content.pages["enter-delivery-address"],
    "enter-address-manually": content.pages["enter-address-manually"],
    "no-address-found": content.pages["no-address-found"],
    "select-delivery-address": content.pages["select-delivery-address"],
    "global-error": content.pages["global-error"],
    "order-tracking": content.pages["order-tracking"],
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
export function usePageContent(page: "global-error"): GlobalErrorContent;
export function usePageContent(page: "order-tracking"): OrderTrackingContent;
export function usePageContent(
  page: "get-self-test-kit-for-HIV" | "enter-delivery-address" | "enter-address-manually" | "no-address-found" | "select-delivery-address" | "global-error" | "order-tracking"
) {
  return content.pages[page];
}

export default useContent;
