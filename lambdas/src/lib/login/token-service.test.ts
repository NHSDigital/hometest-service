import jwt from "jsonwebtoken";

import { type INhsLoginConfig } from "../models/nhs-login/nhs-login-config";
import { type INhsLoginClient } from "./nhs-login-client";
import { TokenService } from "./token-service";

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    decode: jest.fn(),
    verify: jest.fn(),
  },
}));

const mockDecode = jwt.decode as jest.Mock;
const mockVerify = jwt.verify as jest.Mock;

describe("TokenService", () => {
  const nhsLoginConfig: INhsLoginConfig = {
    clientId: "client-id",
    expiresIn: 300,
    redirectUri: "https://example.com/callback",
    baseUri: "https://auth.example",
    privateKey: "private-key",
  };

  const nhsLoginClientMock: Pick<INhsLoginClient, "fetchPublicKeyById"> = {
    fetchPublicKeyById: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    nhsLoginClientMock.fetchPublicKeyById = jest.fn().mockResolvedValue("public-signing-key");
    mockDecode.mockReturnValue({
      header: {
        kid: "kid-123",
      },
    });
    mockVerify.mockReturnValue({
      header: {
        kid: "kid-123",
      },
      payload: {
        sub: "user-123",
      },
      signature: "signature",
    });
  });

  it("verifies token and returns decoded jwt when token is valid", async () => {
    const service = new TokenService(nhsLoginClientMock as INhsLoginClient, nhsLoginConfig);

    const verifiedToken = await service.verifyToken("encoded-token");

    expect(mockDecode).toHaveBeenCalledWith("encoded-token", { complete: true });
    expect(nhsLoginClientMock.fetchPublicKeyById).toHaveBeenCalledWith("kid-123");
    expect(mockVerify).toHaveBeenCalledWith("encoded-token", "public-signing-key", {
      algorithms: ["RS512"],
      issuer: "https://auth.example",
      complete: true,
    });
    expect(verifiedToken).toEqual({
      header: {
        kid: "kid-123",
      },
      payload: {
        sub: "user-123",
      },
      signature: "signature",
    });
  });

  it("throws when token cannot be decoded", async () => {
    const service = new TokenService(nhsLoginClientMock as INhsLoginClient, nhsLoginConfig);
    mockDecode.mockReturnValue(null);

    await expect(service.verifyToken("encoded-token")).rejects.toThrow(
      "token could not be decoded",
    );
    expect(nhsLoginClientMock.fetchPublicKeyById).not.toHaveBeenCalled();
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("throws when decoded token has no kid", async () => {
    const service = new TokenService(nhsLoginClientMock as INhsLoginClient, nhsLoginConfig);
    mockDecode.mockReturnValue({
      header: {},
    });

    await expect(service.verifyToken("encoded-token")).rejects.toThrow(
      "kid is not present in the decoded token",
    );
    expect(nhsLoginClientMock.fetchPublicKeyById).not.toHaveBeenCalled();
  });

  it("throws when public signing key is not found", async () => {
    const service = new TokenService(nhsLoginClientMock as INhsLoginClient, nhsLoginConfig);
    nhsLoginClientMock.fetchPublicKeyById = jest
      .fn()
      .mockResolvedValue(undefined as unknown as string);

    await expect(service.verifyToken("encoded-token")).rejects.toThrow("public key not found");
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("throws when jwt.verify returns null", async () => {
    const service = new TokenService(nhsLoginClientMock as INhsLoginClient, nhsLoginConfig);
    mockVerify.mockReturnValue(null);

    await expect(service.verifyToken("encoded-token")).rejects.toThrow(
      "token could not be verified",
    );
  });
});
