import { validatePostcodeFormat } from "./postcode-validator";

describe("validatePostcodeFormat", () => {
  it("returns valid and cleaned for a correct postcode (with space)", () => {
    expect(validatePostcodeFormat("SW1A 1AA")).toEqual({ valid: true, cleaned: "SW1A 1AA" });
  });

  it("returns valid and cleaned for a correct postcode (no space, lower)", () => {
    expect(validatePostcodeFormat("sw1a1aa")).toEqual({ valid: true, cleaned: "SW1A 1AA" });
  });

  it("returns valid and cleaned for a correct postcode (mixed case, extra spaces)", () => {
    expect(validatePostcodeFormat("  sW1A   1aA ")).toEqual({ valid: true, cleaned: "SW1A 1AA" });
  });

  it("returns valid: false for too short postcodes", () => {
    expect(validatePostcodeFormat("A1A")).toEqual({ valid: false });
  });

  it("returns valid: false for too long postcodes", () => {
    expect(validatePostcodeFormat("SW1A1AA1A")).toEqual({ valid: false });
  });

  it("returns valid: false for invalid format (bad inner code)", () => {
    expect(validatePostcodeFormat("SW1A1A1")).toEqual({ valid: false });
  });

  it("returns valid: false for invalid format (bad outer code)", () => {
    expect(validatePostcodeFormat("1SW1A1AA")).toEqual({ valid: false });
  });

  it("returns valid: false for empty string", () => {
    expect(validatePostcodeFormat("")).toEqual({ valid: false });
  });

  it("returns valid: false for non-alphanumeric input", () => {
    expect(validatePostcodeFormat("@#!$%^")).toEqual({ valid: false });
  });

  it("returns valid and cleaned for a 5-char postcode", () => {
    expect(validatePostcodeFormat("W1A1AA")).toEqual({ valid: true, cleaned: "W1A 1AA" });
  });

  it("returns valid and cleaned for a 7-char postcode", () => {
    expect(validatePostcodeFormat("EC1A1BB")).toEqual({ valid: true, cleaned: "EC1A 1BB" });
  });
});
