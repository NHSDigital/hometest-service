import {
  validateContent,
  isValidContentFile,
  assertValidContent,
} from "../ContentValidator";
import content from "../content.json";

describe("ContentValidator", () => {
  describe("validateContent", () => {
    it("should validate the actual content.json successfully", () => {
      const result = validateContent(content);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail if content is not an object", () => {
      const result = validateContent(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Content must be an object");
    });

    it("should fail if content is an array", () => {
      const result = validateContent([]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Content must be an object");
    });

    it("should fail if commonContent is missing", () => {
      const result = validateContent({ pages: {} });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Content is missing required key: commonContent"
      );
    });

    it("should fail if pages is missing", () => {
      const result = validateContent({ commonContent: {} });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Content is missing required key: pages");
    });

    it("should fail if commonContent.navigation is missing", () => {
      const result = validateContent({
        commonContent: {
          validation: {},
          links: {},
          errorSummary: {},
        },
        pages: {
          "get-self-test-kit-for-HIV": { title: "Test" },
          "enter-delivery-address": { title: "Test" },
          "enter-address-manually": { title: "Test" },
          "no-address-found": { title: "Test" },
        },
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "commonContent is missing required key: navigation"
      );
    });

    it("should fail if navigation.back is not a non-empty string", () => {
      const result = validateContent({
        commonContent: {
          navigation: { back: "", continue: "Continue" },
          validation: {},
          links: {},
          errorSummary: {},
        },
        pages: {
          "get-self-test-kit-for-HIV": { title: "Test" },
          "enter-delivery-address": { title: "Test" },
          "enter-address-manually": { title: "Test" },
          "no-address-found": { title: "Test" },
        },
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "commonContent.navigation.back must be a non-empty string"
      );
    });

    it("should fail if a required page is missing", () => {
      const result = validateContent({
        commonContent: {
          navigation: { back: "Back", continue: "Continue" },
          validation: {},
          links: {},
          errorSummary: {},
        },
        pages: {
          "get-self-test-kit-for-HIV": { title: "Test" },
          "enter-delivery-address": { title: "Test" },
          "enter-address-manually": { title: "Test" },
          // no-address-found is missing
        },
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "pages is missing required key: no-address-found"
      );
    });

    it("should fail if a page title is missing", () => {
      const result = validateContent({
        commonContent: {
          navigation: { back: "Back", continue: "Continue" },
          validation: {},
          links: {},
          errorSummary: {},
        },
        pages: {
          "get-self-test-kit-for-HIV": {}, // missing title
          "enter-delivery-address": { title: "Test" },
          "enter-address-manually": { title: "Test" },
          "no-address-found": { title: "Test" },
        },
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "pages.get-self-test-kit-for-HIV.title must be a non-empty string"
      );
    });
  });

  describe("isValidContentFile", () => {
    it("should return true for valid content", () => {
      expect(isValidContentFile(content)).toBe(true);
    });

    it("should return false for invalid content", () => {
      expect(isValidContentFile(null)).toBe(false);
      expect(isValidContentFile({})).toBe(false);
    });
  });

  describe("assertValidContent", () => {
    it("should not throw for valid content", () => {
      expect(() => assertValidContent(content)).not.toThrow();
    });

    it("should throw for invalid content", () => {
      expect(() => assertValidContent(null)).toThrow(
        "Content validation failed"
      );
    });

    it("should include error details in thrown message", () => {
      expect(() => assertValidContent({})).toThrow(
        /commonContent/
      );
    });
  });
});
