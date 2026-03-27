import { PostgresTokenStore } from "./supplier-token-store";

describe("PostgresTokenStore", () => {
  const dbClient = {
    query: jest.fn(),
    withTransaction: jest.fn(),
    close: jest.fn(),
  } as any;

  const encryptionClient = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when no cached token row exists", async () => {
    dbClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

    const store = new PostgresTokenStore(dbClient, encryptionClient);

    await expect(store.get("supplier-key")).resolves.toBeNull();
  });

  it("returns null when db read throws", async () => {
    dbClient.query.mockRejectedValue(new Error("db down"));

    const store = new PostgresTokenStore(dbClient, encryptionClient);

    await expect(store.get("supplier-key")).resolves.toBeNull();
  });

  it("decrypts token when row exists", async () => {
    dbClient.query.mockResolvedValue({
      rowCount: 1,
      rows: [
        {
          access_token: "ciphertext",
          expires_at: "2026-03-24T12:05:00.000Z",
        },
      ],
    });
    encryptionClient.decrypt.mockResolvedValue("plain-token");

    const store = new PostgresTokenStore(dbClient, encryptionClient);

    await expect(store.get("supplier-key")).resolves.toEqual({
      accessToken: "plain-token",
      expiresAtMs: new Date("2026-03-24T12:05:00.000Z").getTime(),
    });

    expect(encryptionClient.decrypt).toHaveBeenCalledWith("ciphertext");
  });

  it("encrypts token before upsert", async () => {
    encryptionClient.encrypt.mockResolvedValue("encrypted-token");
    dbClient.query.mockResolvedValue({ rowCount: 1, rows: [] });

    const store = new PostgresTokenStore(dbClient, encryptionClient);

    await store.set("supplier-key", {
      accessToken: "plain-token",
      expiresAtMs: 1_700_000_000_000,
    });

    expect(encryptionClient.encrypt).toHaveBeenCalledWith("plain-token");
    expect(dbClient.query).toHaveBeenCalledWith(expect.stringContaining("ON CONFLICT"), [
      "supplier-key",
      "encrypted-token",
      1_700_000_000_000,
    ]);
  });
});
