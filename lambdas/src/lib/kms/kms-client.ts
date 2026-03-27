import { DecryptCommand, EncryptCommand, KMSClient } from "@aws-sdk/client-kms";

import { getAwsClientOptions } from "../aws/aws-client-config";

export interface TokenEncryptionClient {
  encrypt(plaintext: string): Promise<string>;
  decrypt(ciphertext: string): Promise<string>;
}

export class AwsKmsTokenEncryptionClient implements TokenEncryptionClient {
  private readonly client: KMSClient;

  constructor(
    private readonly keyId: string,
    region: string,
  ) {
    this.client = new KMSClient(getAwsClientOptions(region));
  }

  async encrypt(plaintext: string): Promise<string> {
    const response = await this.client.send(
      new EncryptCommand({
        KeyId: this.keyId,
        Plaintext: Buffer.from(plaintext, "utf-8"),
      }),
    );

    if (!response.CiphertextBlob) {
      throw new Error("KMS encrypt returned no ciphertext");
    }

    return Buffer.from(response.CiphertextBlob).toString("base64");
  }

  async decrypt(ciphertext: string): Promise<string> {
    const response = await this.client.send(
      new DecryptCommand({
        KeyId: this.keyId,
        CiphertextBlob: Buffer.from(ciphertext, "base64"),
      }),
    );

    if (!response.Plaintext) {
      throw new Error("KMS decrypt returned no plaintext");
    }

    return Buffer.from(response.Plaintext).toString("utf-8");
  }
}
