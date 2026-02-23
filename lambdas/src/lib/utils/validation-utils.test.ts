import { z } from "zod";
import { generateReadableError } from "./validation-utils";

describe("generateReadableError", () => {
    it("should return a readable error string for a ZodError", () => {
        const schema = z.object({
            orderUID: z.string(),
            code: z.string(),
        });

        const result = schema.safeParse({ orderUID: 123, code: 456 });

        expect(result.success).toBe(false);
        if (!result.success) {
            const readable = generateReadableError(result.error);
            expect(typeof readable).toBe("string");
            expect(readable.length).toBeGreaterThan(0);
            // Should not contain the ✖ character or leading newline/space
            expect(readable).not.toMatch(/\u2716/);
            expect(readable).not.toMatch(/^\s+/);
        }
    });

    it("should handle empty ZodError gracefully", () => {
        const emptyError = new z.ZodError([]);
        const readable = generateReadableError(emptyError);
        expect(typeof readable).toBe("string");
    });
});
