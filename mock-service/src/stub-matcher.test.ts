import { matchRequest, WireMockMapping } from "./stub-matcher";

const makeMappings = (overrides: Partial<WireMockMapping>[]): WireMockMapping[] =>
  overrides.map((o, i) => ({
    priority: o.priority ?? i,
    request: o.request ?? {},
    response: o.response ?? { status: 200 },
  }));

describe("stub-matcher", () => {
  describe("method matching", () => {
    it("matches exact HTTP method", () => {
      const mappings = makeMappings([{ request: { method: "POST" }, response: { status: 201 } }]);
      expect(matchRequest(mappings, { method: "POST", path: "/", headers: {}, queryParameters: {}, body: "" })?.response.status).toBe(201);
    });

    it("rejects wrong HTTP method", () => {
      const mappings = makeMappings([{ request: { method: "POST" }, response: { status: 201 } }]);
      expect(matchRequest(mappings, { method: "GET", path: "/", headers: {}, queryParameters: {}, body: "" })).toBeUndefined();
    });
  });

  describe("urlPath matching", () => {
    it("matches exact urlPath", () => {
      const mappings = makeMappings([{ request: { method: "GET", urlPath: "/order" }, response: { status: 200 } }]);
      expect(matchRequest(mappings, { method: "GET", path: "/order", headers: {}, queryParameters: {}, body: "" })).toBeDefined();
    });

    it("rejects non-matching urlPath", () => {
      const mappings = makeMappings([{ request: { method: "GET", urlPath: "/order" }, response: { status: 200 } }]);
      expect(matchRequest(mappings, { method: "GET", path: "/results", headers: {}, queryParameters: {}, body: "" })).toBeUndefined();
    });
  });

  describe("urlPathPattern matching", () => {
    it("matches regex urlPathPattern", () => {
      const mappings = makeMappings([
        { request: { method: "GET", urlPathPattern: "/(results|api/results)" }, response: { status: 200 } },
      ]);
      expect(matchRequest(mappings, { method: "GET", path: "/results", headers: {}, queryParameters: {}, body: "" })).toBeDefined();
      expect(matchRequest(mappings, { method: "GET", path: "/api/results", headers: {}, queryParameters: {}, body: "" })).toBeDefined();
      expect(matchRequest(mappings, { method: "GET", path: "/unknown", headers: {}, queryParameters: {}, body: "" })).toBeUndefined();
    });
  });

  describe("header matching", () => {
    it("matches header with 'contains'", () => {
      const mappings = makeMappings([
        {
          request: {
            method: "POST",
            headers: { "Content-Type": { contains: "application/x-www-form-urlencoded" } },
          },
          response: { status: 200 },
        },
      ]);
      expect(
        matchRequest(mappings, {
          method: "POST",
          path: "/",
          headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
          queryParameters: {},
          body: "",
        }),
      ).toBeDefined();
    });

    it("matches header with 'matches' (regex)", () => {
      const mappings = makeMappings([
        { request: { headers: { "X-Correlation-ID": { matches: ".*" } } }, response: { status: 200 } },
      ]);
      expect(
        matchRequest(mappings, { method: "GET", path: "/", headers: { "X-Correlation-ID": "abc-123" }, queryParameters: {}, body: "" }),
      ).toBeDefined();
    });

    it("matches headers case-insensitively", () => {
      const mappings = makeMappings([
        { request: { headers: { "Content-Type": { contains: "json" } } }, response: { status: 200 } },
      ]);
      expect(
        matchRequest(mappings, { method: "GET", path: "/", headers: { "content-type": "application/json" }, queryParameters: {}, body: "" }),
      ).toBeDefined();
    });
  });

  describe("queryParameters matching", () => {
    it("matches query param with 'matches'", () => {
      const mappings = makeMappings([
        { request: { queryParameters: { order_uid: { matches: ".{10,}" } } }, response: { status: 200 } },
      ]);
      expect(
        matchRequest(mappings, { method: "GET", path: "/", headers: {}, queryParameters: { order_uid: "550e8400-e29b-41d4-a716-446655440000" }, body: "" }),
      ).toBeDefined();
    });

    it("matches query param with 'absent'", () => {
      const mappings = makeMappings([
        { request: { queryParameters: { order_uid: { absent: true } } }, response: { status: 400 } },
      ]);
      expect(
        matchRequest(mappings, { method: "GET", path: "/", headers: {}, queryParameters: {}, body: "" })?.response.status,
      ).toBe(400);
    });
  });

  describe("bodyPatterns matching", () => {
    it("matches body with 'matches' (regex)", () => {
      const mappings = makeMappings([
        { request: { bodyPatterns: [{ matches: ".*grant_type=client_credentials.*" }] }, response: { status: 200 } },
      ]);
      expect(
        matchRequest(mappings, {
          method: "POST",
          path: "/",
          headers: {},
          queryParameters: {},
          body: "grant_type=client_credentials&client_id=x",
        }),
      ).toBeDefined();
    });

    it("matches body with matchesJsonPath absent", () => {
      const mappings = makeMappings([
        {
          request: {
            bodyPatterns: [{ matchesJsonPath: { expression: "$.subject", absent: true } }],
          },
          response: { status: 422 },
        },
      ]);
      expect(
        matchRequest(mappings, {
          method: "POST",
          path: "/",
          headers: {},
          queryParameters: {},
          body: JSON.stringify({ code: "test" }),
        })?.response.status,
      ).toBe(422);

      // subject IS present → should not match
      expect(
        matchRequest(mappings, {
          method: "POST",
          path: "/",
          headers: {},
          queryParameters: {},
          body: JSON.stringify({ subject: { reference: "#patient-1" } }),
        }),
      ).toBeUndefined();
    });
  });

  describe("priority ordering", () => {
    it("returns the highest-priority (lowest number) match", () => {
      const mappings = makeMappings([
        { priority: 10, request: { method: "POST", urlPath: "/oauth/token" }, response: { status: 400 } },
        { priority: 3, request: { method: "POST", urlPath: "/oauth/token" }, response: { status: 401 } },
        { priority: 5, request: { method: "POST", urlPath: "/oauth/token" }, response: { status: 200 } },
      ]);
      // After sorting by priority, 3 comes first
      expect(matchRequest(mappings, { method: "POST", path: "/oauth/token", headers: {}, queryParameters: {}, body: "" })?.response.status).toBe(401);
    });
  });
});
