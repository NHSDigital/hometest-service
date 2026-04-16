import { AuthTokenVerifier } from "./auth-token-verifier";

const mockDecode = jest.fn();
const mockVerify = jest.fn();
const mockCleanupKey = jest.fn();

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    decode: mockDecode,
    verify: mockVerify,
  },
}));

jest.mock("./auth-utils", () => ({
  cleanupKey: mockCleanupKey,
}));

describe("AuthTokenVerifier", () => {
  const authConfig = {
    keyId: "default-key-id",
    publicKeys: {
      "decoded-kid": "raw-public-key-from-decoded-kid",
      "default-key-id": "raw-public-key-from-default-kid",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCleanupKey.mockReturnValue("clean-public-key");
    mockVerify.mockReturnValue({ sub: "user-123" });
  });

  it("verifies token using decoded kid and default RS512 algorithm", async () => {
    const verifier = new AuthTokenVerifier(authConfig);
    mockDecode.mockReturnValue({
      header: {
        kid: "decoded-kid",
      },
    });

    const token = await verifier.verifyToken("encoded-token");

    expect(mockDecode).toHaveBeenCalledWith("encoded-token", { complete: true });
    expect(mockCleanupKey).toHaveBeenCalledWith("raw-public-key-from-decoded-kid");
    expect(mockVerify).toHaveBeenCalledWith("encoded-token", "clean-public-key", {
      algorithms: ["RS512"],
    });
    expect(token).toEqual({ sub: "user-123" });
  });

  it("falls back to configured keyId when decoded token has no kid", async () => {
    const verifier = new AuthTokenVerifier(authConfig);
    mockDecode.mockReturnValue(undefined);

    await verifier.verifyToken("encoded-token");

    expect(mockCleanupKey).toHaveBeenCalledWith("raw-public-key-from-default-kid");
  });

  it("merges custom verify options with defaults", async () => {
    const verifier = new AuthTokenVerifier(authConfig);
    mockDecode.mockReturnValue({
      header: {
        kid: "decoded-kid",
      },
    });

    await verifier.verifyToken("encoded-token", {
      issuer: "issuer-1",
      algorithms: ["RS256"],
    });

    expect(mockVerify).toHaveBeenCalledWith("encoded-token", "clean-public-key", {
      algorithms: ["RS256"],
      issuer: "issuer-1",
    });
  });

  it("falls back to empty key when cleanupKey returns undefined", async () => {
    const verifier = new AuthTokenVerifier(authConfig);
    mockCleanupKey.mockReturnValue(undefined);
    mockDecode.mockReturnValue({
      header: {
        kid: "decoded-kid",
      },
    });

    await verifier.verifyToken("encoded-token");

    expect(mockVerify).toHaveBeenCalledWith("encoded-token", "", {
      algorithms: ["RS512"],
    });
  });
});
