import { OAuthSupplierAuthClient, createTokenGenerator } from "./supplier-auth-client";

describe("OAuthSupplierAuthClient", () => {
  it("returns access token when successful", async () => {
    const httpClient = {
      post: jest.fn().mockResolvedValue({
        access_token: "token-123",
        expires_in: 3600,
      }),
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
      "orders results",
    );

    const token = await client.getAccessToken();

    expect(token).toBe("token-123");
    expect(secretsClient.getSecretValue).toHaveBeenCalledWith("secret-name");
    expect(httpClient.post).toHaveBeenCalledWith(
      "https://supplier.example.com/oauth/token",
      "grant_type=client_credentials&client_id=client-id&client_secret=secret-abc&scope=orders+results",
      { Accept: "application/json" },
      "application/x-www-form-urlencoded",
    );
  });

  it("returns token metadata from getToken", async () => {
    const httpClient = {
      post: jest.fn().mockResolvedValue({
        access_token: "token-456",
        expires_in: 123,
      }),
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
      "orders results",
    );

    await expect(client.getToken()).resolves.toEqual({
      accessToken: "token-456",
      expiresInSeconds: 123,
    });
  });

  it("coerces expires_in strings to numbers", async () => {
    const httpClient = {
      post: jest.fn().mockResolvedValue({
        access_token: "token-789",
        expires_in: "300",
      }),
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
      "orders results",
    );

    await expect(client.getToken()).resolves.toEqual({
      accessToken: "token-789",
      expiresInSeconds: 300,
    });
  });

  it("falls back to a safe TTL when expires_in is invalid", async () => {
    const httpClient = {
      post: jest.fn().mockResolvedValue({
        access_token: "token-999",
      }),
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
      "orders results",
    );

    await expect(client.getToken()).resolves.toEqual({
      accessToken: "token-999",
      expiresInSeconds: 60,
    });
  });
});

describe("createTokenGenerator", () => {
  const baseConfig = {
    serviceUrl: "https://supplier.example.com",
    clientSecretName: "secret-name",
    clientId: "client-id",
    oauthTokenPath: "/oauth/token",
    oauthScope: "orders results",
    orderPath: "/order",
    resultsPath: "/results",
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.parse("2026-03-24T12:00:00.000Z"));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("reuses in-memory token before expiry", async () => {
    const httpClient = {
      post: jest.fn().mockResolvedValue({
        access_token: "token-abc",
        expires_in: 3600,
      }),
    } as any;

    const secretsClient = {
      getSecretValue: jest.fn().mockResolvedValue("secret-abc"),
    } as any;

    const tokenGenerator = createTokenGenerator(httpClient, secretsClient, baseConfig);

    await expect(tokenGenerator.generateToken()).resolves.toBe("token-abc");
    await expect(tokenGenerator.generateToken()).resolves.toBe("token-abc");

    expect(httpClient.post).toHaveBeenCalledTimes(1);
  });

  it("refreshes token when inside 30 second buffer", async () => {
    const httpClient = {
      post: jest
        .fn()
        .mockResolvedValueOnce({ access_token: "token-1", expires_in: 60 })
        .mockResolvedValueOnce({ access_token: "token-2", expires_in: 60 }),
    } as any;

    const secretsClient = {
      getSecretValue: jest.fn().mockResolvedValue("secret-abc"),
    } as any;

    const tokenGenerator = createTokenGenerator(httpClient, secretsClient, baseConfig);

    await expect(tokenGenerator.generateToken()).resolves.toBe("token-1");

    jest.advanceTimersByTime(31_000);

    await expect(tokenGenerator.generateToken()).resolves.toBe("token-2");
    expect(httpClient.post).toHaveBeenCalledTimes(2);
  });

  it("caps token expiry to 24 hours", async () => {
    const httpClient = {
      post: jest
        .fn()
        .mockResolvedValueOnce({ access_token: "token-long-lived", expires_in: 999_999 })
        .mockResolvedValueOnce({ access_token: "token-refreshed", expires_in: 60 }),
    } as any;

    const secretsClient = {
      getSecretValue: jest.fn().mockResolvedValue("secret-abc"),
    } as any;

    const tokenGenerator = createTokenGenerator(httpClient, secretsClient, baseConfig);

    await expect(tokenGenerator.generateToken()).resolves.toBe("token-long-lived");

    // Just under the 24h cap (86399s) minus the 30s buffer — should still reuse
    jest.advanceTimersByTime((86_399 - 31) * 1000);
    await expect(tokenGenerator.generateToken()).resolves.toBe("token-long-lived");
    expect(httpClient.post).toHaveBeenCalledTimes(1);

    // Past the buffer — token should now be refreshed
    jest.advanceTimersByTime(2_000);
    await expect(tokenGenerator.generateToken()).resolves.toBe("token-refreshed");
    expect(httpClient.post).toHaveBeenCalledTimes(2);
  });

  it("deduplicates concurrent token requests", async () => {
    let resolvePost: ((value: any) => void) | undefined;

    const postPromise = new Promise((resolve) => {
      resolvePost = resolve;
    });

    const httpClient = {
      post: jest.fn().mockReturnValue(postPromise),
    } as any;

    const secretsClient = {
      getSecretValue: jest.fn().mockResolvedValue("secret-abc"),
    } as any;

    const tokenGenerator = createTokenGenerator(httpClient, secretsClient, baseConfig);

    const p1 = tokenGenerator.generateToken();
    const p2 = tokenGenerator.generateToken();
    const p3 = tokenGenerator.generateToken();

    resolvePost!({ access_token: "token-deduped", expires_in: 3600 });

    await expect(Promise.all([p1, p2, p3])).resolves.toEqual([
      "token-deduped",
      "token-deduped",
      "token-deduped",
    ]);
    expect(httpClient.post).toHaveBeenCalledTimes(1);
  });

  it("retries after failed in-flight token request", async () => {
    const httpClient = {
      post: jest
        .fn()
        .mockRejectedValueOnce(new Error("network"))
        .mockResolvedValueOnce({ access_token: "token-ok", expires_in: 3600 }),
    } as any;

    const secretsClient = {
      getSecretValue: jest.fn().mockResolvedValue("secret-abc"),
    } as any;

    const tokenGenerator = createTokenGenerator(httpClient, secretsClient, baseConfig);

    await expect(tokenGenerator.generateToken()).rejects.toThrow("network");
    await expect(tokenGenerator.generateToken()).resolves.toBe("token-ok");

    expect(httpClient.post).toHaveBeenCalledTimes(2);
  });

  it("returns a new generator instance for each call", () => {
    const httpClient = { post: jest.fn() } as any;
    const secretsClient = { getSecretValue: jest.fn() } as any;

    const a = createTokenGenerator(httpClient, secretsClient, baseConfig);
    const b = createTokenGenerator(httpClient, secretsClient, baseConfig);

    expect(a).not.toBe(b);
  });
});

describe("getOrCreateTokenGenerator", () => {
  const baseConfig = {
    serviceUrl: "https://supplier.example.com",
    clientSecretName: "secret-name",
    clientId: "client-id",
    oauthTokenPath: "/oauth/token",
    oauthScope: "orders results",
    orderPath: "/order",
    resultsPath: "/results",
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  const importModule = async () => import("./supplier-auth-client");

  it("reuses cached generator for the same supplier config", async () => {
    const module = await importModule();

    const mockGenerator = { generateToken: jest.fn() };

    const createTokenGeneratorSpy = jest
      .spyOn(module, "createTokenGenerator")
      .mockReturnValue(mockGenerator);

    const httpClient = { post: jest.fn() } as any;
    const secretsClient = { getSecretValue: jest.fn() } as any;

    const first = module.getOrCreateTokenGenerator(httpClient, secretsClient, baseConfig);
    const second = module.getOrCreateTokenGenerator(httpClient, secretsClient, baseConfig);

    expect(first).toBe(second);
    expect(createTokenGeneratorSpy).toHaveBeenCalledTimes(1);
  });

  it("creates a new generator for a different supplier config", async () => {
    const module = await importModule();

    const mockGeneratorA = { generateToken: jest.fn() };
    const mockGeneratorB = { generateToken: jest.fn() };

    const createTokenGeneratorSpy = jest
      .spyOn(module, "createTokenGenerator")
      .mockReturnValueOnce(mockGeneratorA)
      .mockReturnValueOnce(mockGeneratorB);

    const httpClient = { post: jest.fn() } as any;
    const secretsClient = { getSecretValue: jest.fn() } as any;

    const altConfig = { ...baseConfig, serviceUrl: "https://other-supplier.example.com" };

    const first = module.getOrCreateTokenGenerator(httpClient, secretsClient, baseConfig);
    const second = module.getOrCreateTokenGenerator(httpClient, secretsClient, altConfig);

    expect(first).not.toBe(second);
    expect(createTokenGeneratorSpy).toHaveBeenCalledTimes(2);
  });
});
