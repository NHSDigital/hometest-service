import { handleOAuthToken } from "./oauth-token";
import { mockEvent } from "../test-utils/mock-event";

describe("handleOAuthToken", () => {
  it("returns a valid Bearer token for correct client_credentials grant", async () => {
    const result = await handleOAuthToken(
      mockEvent({
        httpMethod: "POST",
        path: "/mock/supplier/oauth/token",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=client_credentials&client_id=supplier1&client_secret=s3cret",
      }),
    );

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.token_type).toBe("Bearer");
    expect(body.expires_in).toBe(3600);
    expect(body.scope).toBe("orders results");
    expect(body.access_token).toBeTruthy();
  });

  it("returns 400 for wrong grant_type", async () => {
    const result = await handleOAuthToken(
      mockEvent({
        httpMethod: "POST",
        path: "/mock/supplier/oauth/token",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=authorization_code&client_id=x&client_secret=y",
      }),
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("unsupported_grant_type");
  });

  it("returns 400 for missing client_id/client_secret", async () => {
    const result = await handleOAuthToken(
      mockEvent({
        httpMethod: "POST",
        path: "/mock/supplier/oauth/token",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=client_credentials",
      }),
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("invalid_request");
  });

  it("returns 400 for wrong Content-Type", async () => {
    const result = await handleOAuthToken(
      mockEvent({
        httpMethod: "POST",
        path: "/mock/supplier/oauth/token",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("invalid_request");
  });

  it("returns 401 when X-Mock-Status is 401", async () => {
    const result = await handleOAuthToken(
      mockEvent({
        httpMethod: "POST",
        path: "/mock/supplier/oauth/token",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Mock-Status": "401",
        },
        body: "grant_type=client_credentials&client_id=x&client_secret=y",
      }),
    );

    expect(result.statusCode).toBe(401);
    expect(JSON.parse(result.body).error).toBe("invalid_client");
  });
});
