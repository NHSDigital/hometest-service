import type { ValidationMessages } from "@/content";
import {
  createAddressSchema,
  createBuildingNameSchema,
  createPostcodeSchema,
} from "@/lib/validation/address-schema";

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
    required: "",
  },
};

describe("address schema", () => {
  const schema = createAddressSchema(mockValidationMessages);

  it("accepts a valid UK address and uppercases postcode", () => {
    const result = schema.safeParse({
      addressLine1: "10 Downing Street",
      addressLine2: "Flat 2",
      addressLine3: "Westminster",
      townOrCity: "London",
      postcode: "sw1a 1aa",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.postcode).toBe("SW1A 1AA");
    }
  });

  it("accepts valid address with optional lines left blank", () => {
    const result = schema.safeParse({
      addressLine1: "1 High Street",
      addressLine2: "",
      addressLine3: "",
      townOrCity: "Leeds",
      postcode: "LS1 4AP",
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = schema.safeParse({
      addressLine1: "   ",
      addressLine2: "",
      addressLine3: "",
      townOrCity: "   ",
      postcode: "",
    });

    if (result.success) {
      throw new Error("Expected validation failure for missing required fields");
    }

    const issueMessages = result.error.issues.map((issue) => issue.message);

    expect(issueMessages).toContain(mockValidationMessages.addressLine1.required);
    expect(issueMessages).toContain(mockValidationMessages.townOrCity.required);
    expect(issueMessages).toContain(mockValidationMessages.postcode.required);
  });

  it("rejects invalid characters in address lines and town", () => {
    const result = schema.safeParse({
      addressLine1: "10 Downing Street@",
      addressLine2: "Block_1",
      addressLine3: "Area_2",
      townOrCity: "London1",
      postcode: "SW1A 1AA",
    });

    if (result.success) {
      throw new Error("Expected validation failure for invalid address characters");
    }

    const issueMessages = result.error.issues.map((issue) => issue.message);

    expect(issueMessages).toContain(mockValidationMessages.addressLine1.invalid);
    expect(issueMessages).toContain(mockValidationMessages.addressLine2.invalid);
    expect(issueMessages).toContain(mockValidationMessages.addressLine3.invalid);
    expect(issueMessages).toContain(mockValidationMessages.townOrCity.invalid);
  });

  it("rejects address line 1 over max length", () => {
    const result = schema.safeParse({
      addressLine1: "A".repeat(101),
      addressLine2: "",
      addressLine3: "",
      townOrCity: "Bristol",
      postcode: "BS1 5AH",
    });

    if (result.success) {
      throw new Error("Expected validation failure for address line 1 length");
    }

    expect(result.error.issues[0].message).toBe(mockValidationMessages.addressLine1.maxLength);
  });
});

describe("postcode schema", () => {
  const schema = createPostcodeSchema(mockValidationMessages);

  it("accepts common valid UK postcode formats", () => {
    const validPostcodes = ["SW1A 1AA", "M1 1AE", "B33 8TH", "CR2 6XH", "DN55 1PT", "EC1A1BB"];

    validPostcodes.forEach((postcode) => {
      const result = schema.safeParse(postcode);
      expect(result.success).toBe(true);
    });
  });

  it("rejects invalid UK postcode formats", () => {
    const invalidPostcodes = ["ABCDE", "12345", "SW1", "SW1A-1AA", "A1 1A"];

    invalidPostcodes.forEach((postcode) => {
      const result = schema.safeParse(postcode);

      if (result.success) {
        throw new Error(`Expected validation failure for ${postcode}`);
      }

      expect(result.error.issues[0].message).toBe(mockValidationMessages.postcode.invalid);
    });
  });

  it("rejects postcodes longer than 8 characters", () => {
    const result = schema.safeParse("EC1A 1BBB");

    if (result.success) {
      throw new Error("Expected validation failure for postcode length");
    }

    expect(result.error.issues[0].message).toBe(mockValidationMessages.postcode.maxLength);
  });
});

describe("building name schema", () => {
  const schema = createBuildingNameSchema(mockValidationMessages);

  it("rejects building names longer than 100 characters", () => {
    const result = schema.safeParse("A".repeat(101));

    if (result.success) {
      throw new Error("Expected validation failure for building name length");
    }

    expect(result.error.issues[0].message).toBe(mockValidationMessages.buildingName.maxLength);
  });
});
