import { base64UrlDecode, base64UrlEncode } from "@/lib/utils/base64url";

describe("base64UrlEncode", () => {
  it("encodes a simple ASCII string", () => {
    expect(base64UrlEncode("hello")).toBe("aGVsbG8");
  });

  it("produces only URL-safe characters (no +, /, or =)", () => {
    const inputs = ["hello", "hello world", '{"csrf":"x","returnTo":"/"}', "\xfb\xfc\xfd\xfe"];
    for (const input of inputs) {
      expect(base64UrlEncode(input)).toMatch(/^[A-Za-z0-9_-]*$/);
    }
  });

  it("encodes a JSON object correctly and round-trips with decode", () => {
    const input = JSON.stringify({ csrf: "abc123", returnTo: "/home" });
    const encoded = base64UrlEncode(input);
    expect(encoded).not.toContain("=");
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(base64UrlDecode(encoded)).toBe(input);
  });

  it("encodes unicode characters correctly", () => {
    const input = "héllo";
    const encoded = base64UrlEncode(input);
    expect(base64UrlDecode(encoded)).toBe(input);
  });
});

describe("base64UrlDecode", () => {
  it("decodes a simple encoded string", () => {
    expect(base64UrlDecode("aGVsbG8")).toBe("hello");
  });

  it("restores - to + before decoding", () => {
    const encoded = base64UrlEncode("\xfb\xfc\xfd\xfe");
    expect(base64UrlDecode(encoded)).toBe("\xfb\xfc\xfd\xfe");
  });

  it("restores _ to / before decoding", () => {
    const encoded = base64UrlEncode("\xff\xfe\xfd");
    expect(base64UrlDecode(encoded)).toBe("\xff\xfe\xfd");
  });

  it("handles input with 0, 1, and 2 missing padding characters", () => {
    // "hello" -> no padding needed after strip (length 7, 7 % 4 = 3 → 1 pad)
    expect(base64UrlDecode("aGVsbG8")).toBe("hello");
    // "he" -> base64 "aGU=" → stripped "aGU" (length 3, 3 % 4 = 3 → 1 pad)
    expect(base64UrlDecode("aGU")).toBe("he");
    // "h" -> base64 "aA==" → stripped "aA" (length 2, 2 % 4 = 2 → 2 pads)
    expect(base64UrlDecode("aA")).toBe("h");
  });

  it("is the inverse of encode for arbitrary strings", () => {
    const inputs = ["", "a", "ab", "abc", "abcd", "hello world", '{"key":"value"}'];
    for (const input of inputs) {
      expect(base64UrlDecode(base64UrlEncode(input))).toBe(input);
    }
  });
});
