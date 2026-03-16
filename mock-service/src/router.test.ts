import { route } from "./router";
import { mockEvent } from "./test-utils/mock-event";

describe("router", () => {
  it("routes GET /mock/health to health handler", async () => {
    const result = await route(mockEvent({ httpMethod: "GET", path: "/mock/health" }));
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.status).toBe("ok");
    expect(body.service).toBe("mock-service");
  });

  it("routes GET /mock/cognito/.well-known/jwks.json to JWKS handler", async () => {
    const result = await route(mockEvent({ httpMethod: "GET", path: "/mock/cognito/.well-known/jwks.json" }));
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.keys).toHaveLength(1);
    expect(body.keys[0].kty).toBe("RSA");
  });

  it("routes POST /mock/supplier/oauth/token to OAuth handler", async () => {
    const result = await route(
      mockEvent({
        httpMethod: "POST",
        path: "/mock/supplier/oauth/token",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=client_credentials&client_id=test&client_secret=secret",
      }),
    );
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.token_type).toBe("Bearer");
  });

  it("routes POST /mock/supplier/order to order handler", async () => {
    const result = await route(
      mockEvent({
        httpMethod: "POST",
        path: "/mock/supplier/order",
        headers: { "Content-Type": "application/fhir+json" },
        body: JSON.stringify({ resourceType: "ServiceRequest" }),
      }),
    );
    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.resourceType).toBe("ServiceRequest");
  });

  it("routes GET /mock/supplier/results with order_uid", async () => {
    const result = await route(
      mockEvent({
        httpMethod: "GET",
        path: "/mock/supplier/results",
        headers: { "X-Correlation-ID": "test-123" },
        queryStringParameters: { order_uid: "550e8400-e29b-41d4-a716-446655440000" },
      }),
    );
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.resourceType).toBe("Bundle");
  });

  it("routes GET /mock/postcode/{postcode}", async () => {
    const result = await route(mockEvent({ httpMethod: "GET", path: "/mock/postcode/SW1A1AA" }));
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.localAuthority.name).toBe("City of Westminster");
  });

  it("returns 404 for unregistered routes", async () => {
    const result = await route(mockEvent({ httpMethod: "GET", path: "/unknown" }));
    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.error).toBe("Not Found");
  });
});
