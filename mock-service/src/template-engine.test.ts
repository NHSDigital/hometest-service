import { renderTemplate } from "./template-engine";

describe("template-engine", () => {
  describe("{{randomValue type='UUID'}}", () => {
    it("replaces with a valid UUID", () => {
      const input = '{"id": "{{randomValue type=\'UUID\'}}"}';
      const result = renderTemplate(input);
      const parsed = JSON.parse(result);
      expect(parsed.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it("replaces multiple UUIDs with unique values", () => {
      const input = "{{randomValue type='UUID'}} {{randomValue type='UUID'}}";
      const result = renderTemplate(input);
      const [a, b] = result.split(" ");
      expect(a).not.toBe(b);
    });
  });

  describe("{{now ...}}", () => {
    it("replaces {{now}} with ISO date string", () => {
      const result = renderTemplate("{{now}}");
      expect(new Date(result).toISOString()).toBe(result);
    });

    it("applies format", () => {
      const result = renderTemplate("{{now format='yyyy-MM-dd'}}");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("applies negative offset", () => {
      const result = renderTemplate("{{now offset='-2 days' format='yyyy-MM-dd'}}");
      const expected = new Date();
      expected.setDate(expected.getDate() - 2);
      expect(result).toBe(
        `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, "0")}-${String(expected.getDate()).padStart(2, "0")}`,
      );
    });
  });
});
