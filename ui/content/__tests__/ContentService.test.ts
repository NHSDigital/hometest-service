import { content, getCommonContent, getPageContent } from "../ContentService";
import type { ContentFile } from "../schema";

describe("ContentService", () => {
  describe("content", () => {
    it("should export a valid ContentFile object", () => {
      expect(content).toBeDefined();
      expect(typeof content).toBe("object");
    });

    it("should have commonContent", () => {
      expect(content.commonContent).toBeDefined();
      expect(content.commonContent.navigation).toBeDefined();
      expect(content.commonContent.validation).toBeDefined();
      expect(content.commonContent.links).toBeDefined();
      expect(content.commonContent.errorSummary).toBeDefined();
    });

    it("should have all required pages", () => {
      expect(content.pages).toBeDefined();
      expect(content.pages["get-self-test-kit-for-HIV"]).toBeDefined();
      expect(content.pages["enter-delivery-address"]).toBeDefined();
      expect(content.pages["enter-address-manually"]).toBeDefined();
      expect(content.pages["no-address-found"]).toBeDefined();
    });

    it("should have correct navigation content", () => {
      expect(content.commonContent.navigation.back).toBe("Back");
      expect(content.commonContent.navigation.continue).toBe("Continue");
    });

    it("should have correct start page title", () => {
      expect(content.pages["get-self-test-kit-for-HIV"].title).toBe("Get a self-test kit for HIV");
    });
  });

  describe("getCommonContent", () => {
    it("should return the commonContent object", () => {
      const common = getCommonContent();
      expect(common).toBe(content.commonContent);
    });

    it("should include validation messages", () => {
      const common = getCommonContent();
      expect(common.validation.postcode.required).toBe(
        "Enter a full UK postcode"
      );
    });
  });

  describe("getPageContent", () => {
    it("should return start page content", () => {
      const start = getPageContent("get-self-test-kit-for-HIV");
      expect(start.title).toBe("Get a self-test kit for HIV");
      expect(start.ageRequirement).toBeDefined();
    });

    it("should return enterDeliveryAddress page content", () => {
      const page = getPageContent("enter-delivery-address");
      expect(page.title).toBe(
        "Enter your delivery address and we'll check if the kit's available"
      );
      expect(page.form.postcodeLabel).toBe("Postcode");
    });

    it("should return enterAddressManually page content", () => {
      const page = getPageContent("enter-address-manually");
      expect(page.title).toBe("Enter your address");
      expect(page.form.addressLine1Label).toBe("Address line 1");
    });

    it("should return noAddressFound page content", () => {
      const page = getPageContent("no-address-found");
      expect(page.title).toBe("No address found");
      expect(page.tryNewSearchLink).toBe("Try a new search");
    });
  });

  describe("type safety", () => {
    it("should have proper typing for ContentFile", () => {
      // This is a compile-time check - if types are wrong, this won't compile
      const typedContent: ContentFile = content;
      expect(typedContent.commonContent.navigation.back).toBeDefined();
    });
  });
});
