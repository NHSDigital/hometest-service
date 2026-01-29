/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useContent, useCommonContent, usePageContent } from "../useContent";
import { content } from "@/content/ContentService";

describe("useContent hook", () => {
  describe("useContent", () => {
    it("should return all content sections", () => {
      const { result } = renderHook(() => useContent());

      expect(result.current.commonContent).toBeDefined();
      expect(result.current["get-self-test-kit-for-HIV"]).toBeDefined();
      expect(result.current["enter-delivery-address"]).toBeDefined();
      expect(result.current["enter-address-manually"]).toBeDefined();
      expect(result.current["no-address-found"]).toBeDefined();
    });

    it("should return the same content as the static content object", () => {
      const { result } = renderHook(() => useContent());

      expect(result.current.commonContent).toBe(content.commonContent);
      expect(result.current["get-self-test-kit-for-HIV"]).toBe(content.pages["get-self-test-kit-for-HIV"]);
    });

    it("should provide access to navigation content", () => {
      const { result } = renderHook(() => useContent());

      expect(result.current.commonContent.navigation.back).toBe("Back");
      expect(result.current.commonContent.navigation.continue).toBe("Continue");
    });

    it("should provide access to validation messages", () => {
      const { result } = renderHook(() => useContent());

      expect(result.current.commonContent.validation.postcode.required).toBe(
        "Enter a full UK postcode"
      );
    });

    it("should provide access to start page content", () => {
      const { result } = renderHook(() => useContent());

      expect(result.current["get-self-test-kit-for-HIV"].title).toBe("Get a self-test kit for HIV");
      expect(result.current["get-self-test-kit-for-HIV"].ageRequirement).toBe(
        "You can use this service if you are aged 18 or over."
      );
    });
  });

  describe("useCommonContent", () => {
    it("should return common content only", () => {
      const { result } = renderHook(() => useCommonContent());

      expect(result.current.navigation).toBeDefined();
      expect(result.current.validation).toBeDefined();
      expect(result.current.links).toBeDefined();
      expect(result.current.errorSummary).toBeDefined();
    });

    it("should return the same object as content.commonContent", () => {
      const { result } = renderHook(() => useCommonContent());

      expect(result.current).toBe(content.commonContent);
    });
  });

  describe("usePageContent", () => {
    it("should return start page content", () => {
      const { result } = renderHook(() => usePageContent("get-self-test-kit-for-HIV"));

      expect(result.current.title).toBe("Get a self-test kit for HIV");
    });

    it("should return enterDeliveryAddress page content", () => {
      const { result } = renderHook(() =>
        usePageContent("enter-delivery-address")
      );

      expect(result.current.title).toBe(
        "Enter your delivery address and we'll check if the kit's available"
      );
    });

    it("should return enterAddressManually page content", () => {
      const { result } = renderHook(() =>
        usePageContent("enter-address-manually")
      );

      expect(result.current.title).toBe("Enter your address");
    });

    it("should return noAddressFound page content", () => {
      const { result } = renderHook(() => usePageContent("no-address-found"));

      expect(result.current.title).toBe("No address found");
    });
  });
});
