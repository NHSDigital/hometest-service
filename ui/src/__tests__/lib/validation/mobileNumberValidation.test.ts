import { validateMobileNumber } from "@/lib/validation/mobileNumberValidation";
import type { ValidationMessages } from "@/content/schema";

const mockValidationMessages: ValidationMessages = {
  postcode: {
    required: "Enter a full UK postcode",
    maxLength: "Postcode must be 8 characters or less",
    invalid: "Enter a postcode using letters and numbers",
  },
  buildingName: {
    maxLength: "Building number or name must be 100 characters or less",
  },
  addressLine1: {
    required: "Enter address line 1, typically the building and street",
    maxLength: "Address line 1 must be 100 characters or less",
    invalid: "Enter address line 1, typically the building and street",
  },
  addressLine2: {
    maxLength: "Address line 2 must be 100 characters or less",
    invalid: "Enter address line 2, typically the building and street",
  },
  addressLine3: {
    maxLength: "Address line 3 must be 100 characters or less",
    invalid: "Enter address line 3, typically the building and street",
  },
  townOrCity: {
    required: "Enter a city or town",
    maxLength: "City or town must be 100 characters or less",
    invalid: "Enter a city or town",
  },
  deliveryAddress: {
    required: "Select a delivery address",
  },
  comfortableDoingTest: {
    required: "Select yes if you're comfortable doing the test yourself",
  },
  mobileNumber: {
    required: "Enter a UK mobile phone number",
    invalid: "Enter a UK mobile phone number",
  },
};

describe("validateMobileNumber", () => {
  describe("Required Field Validation", () => {
    it("should return error for empty string", () => {
      const result = validateMobileNumber("", mockValidationMessages);
      expect(result).toEqual({
        valid: false,
        message: "Enter a UK mobile phone number",
      });
    });

    it("should return error for string with only spaces", () => {
      const result = validateMobileNumber("   ", mockValidationMessages);
      expect(result).toEqual({
        valid: false,
        message: "Enter a UK mobile phone number",
      });
    });
  });

  describe("Valid UK Mobile Number Formats", () => {
    it("should accept valid UK mobile with 07 prefix and no formatting", () => {
      const result = validateMobileNumber("07771900900", mockValidationMessages);
      expect(result).toEqual({
        valid: true,
        value: "07771900900",
      });
    });

    it("should accept valid UK mobile with 07 prefix and spaces", () => {
      const result = validateMobileNumber("07771 900 900", mockValidationMessages);
      expect(result).toEqual({
        valid: true,
        value: "07771900900",
      });
    });

    it("should accept valid UK mobile with 07 prefix and hyphens", () => {
      const result = validateMobileNumber("07771-900-900", mockValidationMessages);
      expect(result).toEqual({
        valid: true,
        value: "07771900900",
      });
    });

    it("should accept valid UK mobile with 07 prefix and parentheses", () => {
      const result = validateMobileNumber("(07771) 900900", mockValidationMessages);
      expect(result).toEqual({
        valid: true,
        value: "07771900900",
      });
    });

    it("should accept valid UK mobile with +44 prefix and no formatting", () => {
      const result = validateMobileNumber("+447771900900", mockValidationMessages);
      expect(result).toEqual({
        valid: true,
        value: "+447771900900",
      });
    });

    it("should accept valid UK mobile with +44 prefix and spaces", () => {
      const result = validateMobileNumber("+44 7771 900 900", mockValidationMessages);
      expect(result).toEqual({
        valid: true,
        value: "+447771900900",
      });
    });

    it("should accept valid UK mobile with 0044 prefix", () => {
      const result = validateMobileNumber("00447771900900", mockValidationMessages);
      expect(result).toEqual({
        valid: true,
        value: "00447771900900",
      });
    });

    it("should accept valid UK mobile with 44 prefix", () => {
      const result = validateMobileNumber("447771900900", mockValidationMessages);
      expect(result).toEqual({
        valid: true,
        value: "447771900900",
      });
    });

    it("should accept UK mobile with mixed formatting", () => {
      const result = validateMobileNumber("07771 900-900", mockValidationMessages);
      expect(result).toEqual({
        valid: true,
        value: "07771900900",
      });
    });
  });

  describe("Invalid UK Mobile Number Formats", () => {
    it("should reject UK landline numbers (01xxx)", () => {
      const result = validateMobileNumber("01234567890", mockValidationMessages);
      expect(result).toEqual({
        valid: false,
        message: "Enter a UK mobile phone number",
      });
    });

    it("should reject UK landline numbers (02xxx)", () => {
      const result = validateMobileNumber("02071234567", mockValidationMessages);
      expect(result).toEqual({
        valid: false,
        message: "Enter a UK mobile phone number",
      });
    });

    it("should reject numbers with non-UK mobile prefix (06xxx)", () => {
      const result = validateMobileNumber("06777900900", mockValidationMessages);
      expect(result).toEqual({
        valid: false,
        message: "Enter a UK mobile phone number",
      });
    });

    it("should reject numbers with non-UK mobile prefix (08xxx)", () => {
      const result = validateMobileNumber("08777900900", mockValidationMessages);
      expect(result).toEqual({
        valid: false,
        message: "Enter a UK mobile phone number",
      });
    });

    it("should reject numbers with non-UK mobile prefix (09xxx)", () => {
      const result = validateMobileNumber("09777900900", mockValidationMessages);
      expect(result).toEqual({
        valid: false,
        message: "Enter a UK mobile phone number",
      });
    });
  });

  describe("Invalid Characters", () => {
    it("should reject numbers with letters", () => {
      const result = validateMobileNumber("07771ABC900", mockValidationMessages);
      expect(result).toEqual({
        valid: false,
        message: "Enter a UK mobile phone number",
      });
    });

    it("should reject numbers with special characters (not allowed)", () => {
      const invalidNumbers = [
        "07771@900900",
        "07771#900900",
        "07771.900.900",
        "07771/900/900",
        "07771*900900",
      ];

      invalidNumbers.forEach((number) => {
        const result = validateMobileNumber(number, mockValidationMessages);
        expect(result).toEqual({
          valid: false,
          message: "Enter a UK mobile phone number",
        });
      });
    });
  });

  describe("Length Validation", () => {
    it("should reject numbers with too few digits", () => {
      const shortNumbers = [
        "077",
        "07771",
        "07771 900",
        "+44 7",
        "077719009",
      ];

      shortNumbers.forEach((number) => {
        const result = validateMobileNumber(number, mockValidationMessages);
        expect(result).toEqual({
          valid: false,
          message: "Enter a UK mobile phone number",
        });
      });
    });

    it("should reject numbers with more than 15 digits", () => {
      const result = validateMobileNumber("07771900900123456", mockValidationMessages);
      expect(result).toEqual({
        valid: false,
        message: "Enter a UK mobile phone number",
      });
    });

    it("should accept numbers with exactly 10 digits (07 + 9 digits)", () => {
      const result = validateMobileNumber("07771900900", mockValidationMessages);
      expect(result).toEqual({
        valid: true,
        value: "07771900900",
      });
    });

    it("should accept numbers with 13 digits (+44 + 10 digits)", () => {
      const result = validateMobileNumber("+447771900900", mockValidationMessages);
      expect(result).toEqual({
        valid: true,
        value: "+447771900900",
      });
    });
  });

  describe("International Number Validation", () => {
    it("should reject non-UK international numbers (US)", () => {
      const result = validateMobileNumber("+1 555 123 4567", mockValidationMessages);
      expect(result).toEqual({
        valid: false,
        message: "Enter a UK mobile phone number",
      });
    });

    it("should reject non-UK international numbers (Ireland)", () => {
      const result = validateMobileNumber("+353 87 123 4567", mockValidationMessages);
      expect(result).toEqual({
        valid: false,
        message: "Enter a UK mobile phone number",
      });
    });

    it("should reject non-UK international numbers (France)", () => {
      const result = validateMobileNumber("+33 6 12 34 56 78", mockValidationMessages);
      expect(result).toEqual({
        valid: false,
        message: "Enter a UK mobile phone number",
      });
    });

    it("should reject non-UK international numbers (Australia)", () => {
      const result = validateMobileNumber("+61 412 345 678", mockValidationMessages);
      expect(result).toEqual({
        valid: false,
        message: "Enter a UK mobile phone number",
      });
    });
  });

  describe("Edge Cases", () => {
    it("should trim whitespace before and after number", () => {
      const result = validateMobileNumber("  07771900900  ", mockValidationMessages);
      expect(result).toEqual({
        valid: true,
        value: "07771900900",
      });
    });

    it("should handle number with leading zeros correctly", () => {
      const result = validateMobileNumber("007771900900", mockValidationMessages);
      expect(result).toEqual({
        valid: false,
        message: "Enter a UK mobile phone number",
      });
    });

    it("should reject number missing leading 0 from 07xxx format", () => {
      const result = validateMobileNumber("7771900900", mockValidationMessages);
      expect(result).toEqual({
        valid: false,
        message: "Enter a UK mobile phone number",
      });
    });
  });
});
