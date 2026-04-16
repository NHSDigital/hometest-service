import { z } from "zod";

import { generateReadableError } from "./validation-utils";

describe("generateReadableError", () => {
  it("should return a readable error string for a ZodError with multiple issues", () => {
    const schema = z.object({
      orderUID: z.string(),
      code: z.string(),
      arrayStuff: z.array(z.string()).min(1),
    });

    const result = schema.safeParse({ orderUID: 123, code: 456, arrayStuff: [2] });

    expect(result.success).toBe(false);
    if (result.error) {
      // optional expects inside if statement because Sonarqube
      // doesn't like us telling typescript that we know result.error is defined
      const readable = generateReadableError(result.error);
      expect(typeof readable).toBe("string");
      expect(readable.length).toBeGreaterThan(0);
      expect(readable).toContain("orderUID:");
      expect(readable).toContain("code:");
      expect(readable).toContain("arrayStuff.0:");
    }
  });

  it("should handle empty ZodError gracefully", () => {
    const emptyError = new z.ZodError([]);
    const readable = generateReadableError(emptyError);
    expect(typeof readable).toBe("string");
    expect(readable).toBe("");
  });

  it("should handle nested object errors", () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        age: z.number(),
      }),
    });

    const result = schema.safeParse({ user: { name: 123, age: "not-a-number" } });

    expect(result.success).toBe(false);
    if (result.error) {
      const readable = generateReadableError(result.error);
      expect(readable).toContain("user.name:");
      expect(readable).toContain("user.age:");
    }
  });

  it("should handle array of objects errors", () => {
    const schema = z.object({
      items: z.array(z.object({ id: z.string() })),
    });

    const result = schema.safeParse({ items: [{ id: 1 }, { id: 2 }] });

    expect(result.success).toBe(false);
    if (result.error) {
      const readable = generateReadableError(result.error);
      expect(readable).toContain("items.0.id:");
      expect(readable).toContain("items.1.id:");
    }
  });
});
