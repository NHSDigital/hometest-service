const mockSend = jest.fn();

jest.mock("@aws-sdk/client-kms", () => ({
  KMSClient: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  EncryptCommand: jest.fn().mockImplementation((params) => params),
  DecryptCommand: jest.fn().mockImplementation((params) => params),
}));

import { AwsKmsTokenEncryptionClient } from "./kms-client";

describe("AwsKmsTokenEncryptionClient", () => {
  let client: AwsKmsTokenEncryptionClient;

  beforeEach(() => {
    client = new AwsKmsTokenEncryptionClient("alias/test-key", "eu-west-2");
    mockSend.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("encrypts plaintext to base64 ciphertext", async () => {
    mockSend.mockResolvedValue({
      CiphertextBlob: Buffer.from("encrypted-token", "utf-8"),
    });

    const value = await client.encrypt("plain-token");

    expect(value).toBe(Buffer.from("encrypted-token", "utf-8").toString("base64"));
  });

  it("throws when encrypt response is missing ciphertext", async () => {
    mockSend.mockResolvedValue({});

    await expect(client.encrypt("plain-token")).rejects.toThrow(
      "KMS encrypt returned no ciphertext",
    );
  });

  it("decrypts base64 ciphertext to plaintext", async () => {
    mockSend.mockResolvedValue({
      Plaintext: Buffer.from("plain-token", "utf-8"),
    });

    const value = await client.decrypt(Buffer.from("cipher", "utf-8").toString("base64"));

    expect(value).toBe("plain-token");
  });

  it("throws when decrypt response is missing plaintext", async () => {
    mockSend.mockResolvedValue({});

    await expect(client.decrypt("ZW5jcnlwdGVk")).rejects.toThrow(
      "KMS decrypt returned no plaintext",
    );
  });
});
