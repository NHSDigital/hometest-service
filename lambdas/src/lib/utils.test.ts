import { isUUID } from "./utils";

describe("isUUID", () => {
  it("returns true for valid UUIDs", () => {
    expect(isUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    expect(isUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isUUID("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(true);
  });

  it("returns false for invalid UUIDs", () => {
    expect(isUUID("not-a-uuid")).toBe(false);
    expect(isUUID("123e4567e89b12d3a456426614174000")).toBe(false);
    expect(isUUID("123e4567-e89b-12d3-a456-42661417400")).toBe(false); // too short
    expect(isUUID("123e4567-e89b-12d3-a456-4266141740000")).toBe(false); // too long
    expect(isUUID("123e4567-e89b-62d3-a456-426614174000")).toBe(false); // invalid version
    expect(isUUID("")).toBe(false);
    expect(isUUID(null as unknown as string)).toBe(false);
    expect(isUUID(undefined as unknown as string)).toBe(false);
  });
});
