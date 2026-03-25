import { createMobileNumberSchema } from "@/lib/validation/mobile-number-schema";
import type { ValidationMessages } from "@/content";

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
  consent: {
    required: ""
  }
};

describe("mobile number Zod schema", () => {
  const schema = createMobileNumberSchema(mockValidationMessages);

  describe("Required Field Validation", () => {
    it("should return error for empty string", () => {
      const result = schema.safeParse("");
      if (result.success) return fail("Expected failure for empty string");
      expect(result.error.issues[0].message).toBe(
        mockValidationMessages.mobileNumber.required
      );
    });

    it("should return error for string with only spaces", () => {
      const result = schema.safeParse("   ");
      if (result.success) return fail("Expected failure for spaces");
      expect(result.error.issues[0].message).toBe(
        mockValidationMessages.mobileNumber.required
      );
    });
  });

  describe("Valid UK Mobile Number Formats", () => {
    it("should accept valid UK mobile with 07 prefix and no formatting", () => {
      const result = schema.safeParse("07771900900");
      expect(result.success).toBe(true);
      expect(result.data).toBe("07771900900");
    });

    it("should accept valid UK mobile with 07 prefix and spaces", () => {
      const result = schema.safeParse("07771 900 900");
      expect(result.success).toBe(true);
      expect(result.data).toBe("07771900900");
    });

    it("should accept valid UK mobile with 07 prefix and hyphens", () => {
      const result = schema.safeParse("07771-900-900");
      expect(result.success).toBe(true);
      expect(result.data).toBe("07771900900");
    });

    it("should accept valid UK mobile with 07 prefix and parentheses", () => {
      const result = schema.safeParse("(07771) 900900");
      expect(result.success).toBe(true);
      expect(result.data).toBe("07771900900");
    });

    it("should accept valid UK mobile with +44 prefix and no formatting", () => {
      const result = schema.safeParse("+447771900900");
      expect(result.success).toBe(true);
      expect(result.data).toBe("+447771900900");
    });

    it("should accept valid UK mobile with +44 prefix and spaces", () => {
      const result = schema.safeParse("+44 7771 900 900");
      expect(result.success).toBe(true);
      expect(result.data).toBe("+447771900900");
    });

    it("should accept valid UK mobile with 0044 prefix", () => {
      const result = schema.safeParse("00447771900900");
      expect(result.success).toBe(true);
      expect(result.data).toBe("00447771900900");
    });

    it("should accept valid UK mobile with 44 prefix", () => {
      const result = schema.safeParse("447771900900");
      expect(result.success).toBe(true);
      expect(result.data).toBe("447771900900");
    });

    it("should accept UK mobile with mixed formatting", () => {
      const result = schema.safeParse("07771 900-900");
      expect(result.success).toBe(true);
      expect(result.data).toBe("07771900900");
    });
  });

  describe("Invalid UK Mobile Number Formats", () => {
    it("should reject UK landline numbers (01xxx)", () => {
      const result = schema.safeParse("01234567890");
      if (result.success) return fail("Expected failure for 01xxx");
      expect(result.error.issues[0].message).toBe(
        mockValidationMessages.mobileNumber.invalid
      );
    });

    it("should reject UK landline numbers (02xxx)", () => {
      const result = schema.safeParse("02071234567");
      if (result.success) return fail("Expected failure for 02xxx");
      expect(result.error.issues[0].message).toBe(
        mockValidationMessages.mobileNumber.invalid
      );
    });

    it("should reject numbers with non-UK mobile prefix (06xxx)", () => {
      const result = schema.safeParse("06777900900");
      if (result.success) return fail("Expected failure for 06xxx");
      expect(result.error.issues[0].message).toBe(
        mockValidationMessages.mobileNumber.invalid
      );
    });

    it("should reject numbers with non-UK mobile prefix (08xxx)", () => {
      const result = schema.safeParse("08777900900");
      if (result.success) return fail("Expected failure for 08xxx");
      expect(result.error.issues[0].message).toBe(
        mockValidationMessages.mobileNumber.invalid
      );
    });

    it("should reject numbers with non-UK mobile prefix (09xxx)", () => {
      const result = schema.safeParse("09777900900");
      if (result.success) return fail("Expected failure for 09xxx");
      expect(result.error.issues[0].message).toBe(
        mockValidationMessages.mobileNumber.invalid
      );
    });
  });

  describe("Invalid Characters", () => {
    it("should reject numbers with letters", () => {
      const result = schema.safeParse("07771ABC900");
      if (result.success) return fail("Expected failure for letters");
      expect(result.error.issues[0].message).toBe(
        mockValidationMessages.mobileNumber.invalid
      );
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
        const result = schema.safeParse(number);
        if (result.success) return fail(`Expected failure for ${number}`);
        expect(result.error.issues[0].message).toBe(
          mockValidationMessages.mobileNumber.invalid
        );
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
        const result = schema.safeParse(number);
        if (result.success) return fail(`Expected failure for ${number}`);
        expect(result.error.issues[0].message).toBe(
          mockValidationMessages.mobileNumber.invalid
        );
      });
    });

    it("should reject numbers with more than 15 digits", () => {
      const result = schema.safeParse("07771900900123456");
      if (result.success) return fail("Expected failure for too many digits");
      expect(result.error.issues[0].message).toBe(
        mockValidationMessages.mobileNumber.invalid
      );
    });

    it("should accept numbers with exactly 10 digits (07 + 9 digits)", () => {
      const result = schema.safeParse("07771900900");
      expect(result.success).toBe(true);
      expect(result.data).toBe("07771900900");
    });

    it("should accept numbers with 13 digits (+44 + 10 digits)", () => {
      const result = schema.safeParse("+447771900900");
      expect(result.success).toBe(true);
      expect(result.data).toBe("+447771900900");
    });
  });

  describe("International Number Validation", () => {
    it("should reject non-UK international numbers (US)", () => {
      const result = schema.safeParse("+1 555 123 4567");
      if (result.success) return fail("Expected failure for US number");
      expect(result.error.issues[0].message).toBe(
        mockValidationMessages.mobileNumber.invalid
      );
    });

    it("should reject non-UK international numbers (Ireland)", () => {
      const result = schema.safeParse("+353 87 123 4567");
      if (result.success) return fail("Expected failure for Ireland number");
      expect(result.error.issues[0].message).toBe(
        mockValidationMessages.mobileNumber.invalid
      );
    });

    it("should reject non-UK international numbers (France)", () => {
      const result = schema.safeParse("+33 6 12 34 56 78");
      if (result.success) return fail("Expected failure for France number");
      expect(result.error.issues[0].message).toBe(
        mockValidationMessages.mobileNumber.invalid
      );
    });

    it("should reject non-UK international numbers (Australia)", () => {
      const result = schema.safeParse("+61 412 345 678");
      if (result.success) return fail("Expected failure for Australia number");
      expect(result.error.issues[0].message).toBe(
        mockValidationMessages.mobileNumber.invalid
      );
    });
  });

  describe("Edge Cases", () => {
    it("should trim whitespace before and after number", () => {
      const result = schema.safeParse("  07771900900  ");
      expect(result.success).toBe(true);
      expect(result.data).toBe("07771900900");
    });

    it("should handle number with leading zeros correctly", () => {
      const result = schema.safeParse("007771900900");
      if (result.success) return fail("Expected failure for leading zeros");
      expect(result.error.issues[0].message).toBe(
        mockValidationMessages.mobileNumber.invalid
      );
    });

    it("should reject number missing leading 0 from 07xxx format", () => {
      const result = schema.safeParse("7771900900");
      if (result.success) return fail("Expected failure for missing leading 0");
      expect(result.error.issues[0].message).toBe(
        mockValidationMessages.mobileNumber.invalid
      );
    });
  });
});
