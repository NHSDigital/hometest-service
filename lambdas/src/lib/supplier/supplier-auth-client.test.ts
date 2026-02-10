import { OAuthSupplierAuthClient } from "./supplier-auth-client";

describe("OAuthSupplierAuthClient", () => {
  it("returns access token when successful", async () => {
    const httpClient = {
      post: jest.fn().mockResolvedValue({ access_token: "token-123" }),
    } as any;

    const secretsClient = {
      getSecretValue: jest.fn().mockResolvedValue("secret-abc"),
    } as any;

    const client = new OAuthSupplierAuthClient(
      httpClient,
      secretsClient,
      "https://supplier.example.com",
      "/oauth/token",
      "client-id",
      "secret-name",
    );

    const token = await client.getAccessToken();

    expect(token).toBe("token-123");
    expect(secretsClient.getSecretValue).toHaveBeenCalledWith("secret-name", {
      jsonKey: "client_secret",
    });
    expect(httpClient.post).toHaveBeenCalledWith(
      "https://supplier.example.com/oauth/token",
      "grant_type=client_credentials&client_id=client-id&client_secret=secret-abc&scope=orders+results",
      { Accept: "application/json" },
      "application/x-www-form-urlencoded",
    );
  });

  it("uses custom scope when provided", async () => {
    const httpClient = {
      post: jest.fn().mockResolvedValue({ access_token: "token-456" }),
    } as any;

    const secretsClient = {
      getSecretValue: jest.fn().mockResolvedValue("secret-abc"),
    } as any;

    const client = new OAuthSupplierAuthClient(
      httpClient,
      secretsClient,
      "https://supplier.example.com",
      "/oauth/token",
      "client-id",
      "secret-name",
      "custom scope",
    );

    const token = await client.getAccessToken();

    expect(token).toBe("token-456");
    expect(httpClient.post).toHaveBeenCalledWith(
      "https://supplier.example.com/oauth/token",
      "grant_type=client_credentials&client_id=client-id&client_secret=secret-abc&scope=custom+scope",
      { Accept: "application/json" },
      "application/x-www-form-urlencoded",
    );
  });

  it("propagates errors from secrets client", async () => {
    const httpClient = { post: jest.fn() } as any;
    const secretsClient = {
      getSecretValue: jest.fn().mockRejectedValue(new Error("secret error")),
    } as any;

    const client = new OAuthSupplierAuthClient(
      httpClient,
      secretsClient,
      "https://supplier.example.com",
      "/oauth/token",
      "client-id",
      "secret-name",
    );

    await expect(client.getAccessToken()).rejects.toThrow("secret error");
  });

  it("propagates errors from http client", async () => {
    const httpClient = {
      post: jest.fn().mockRejectedValue(new Error("http error")),
    } as any;

    const secretsClient = {
      getSecretValue: jest.fn().mockResolvedValue("secret-abc"),
    } as any;

    const client = new OAuthSupplierAuthClient(
      httpClient,
      secretsClient,
      "https://supplier.example.com",
      "/oauth/token",
      "client-id",
      "secret-name",
    );

    await expect(client.getAccessToken()).rejects.toThrow("http error");
  });
});
