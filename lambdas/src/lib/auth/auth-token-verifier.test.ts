const authTokenVerifierMockDecode = jest.fn();
const authTokenVerifierMockVerify = jest.fn();
const authTokenVerifierMockCleanupKey = jest.fn();

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    decode: authTokenVerifierMockDecode,
    verify: authTokenVerifierMockVerify,
  },
}));

jest.mock("./auth-utils", () => ({
  cleanupKey: authTokenVerifierMockCleanupKey,
}));

const { AuthTokenVerifier } =
  jest.requireActual<typeof import("./auth-token-verifier")>("./auth-token-verifier");

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
    authTokenVerifierMockCleanupKey.mockReturnValue("clean-public-key");
    authTokenVerifierMockVerify.mockReturnValue({ sub: "user-123" });
  });

  it("verifies token using decoded kid and default RS512 algorithm", async () => {
    const verifier = new AuthTokenVerifier(authConfig);
    authTokenVerifierMockDecode.mockReturnValue({
      header: {
        kid: "decoded-kid",
      },
    });

    const token = await verifier.verifyToken("encoded-token");

    expect(authTokenVerifierMockDecode).toHaveBeenCalledWith("encoded-token", { complete: true });
    expect(authTokenVerifierMockCleanupKey).toHaveBeenCalledWith("raw-public-key-from-decoded-kid");
    expect(authTokenVerifierMockVerify).toHaveBeenCalledWith("encoded-token", "clean-public-key", {
      algorithms: ["RS512"],
    });
    expect(token).toEqual({ sub: "user-123" });
  });

  it("falls back to configured keyId when decoded token has no kid", async () => {
    const verifier = new AuthTokenVerifier(authConfig);
    authTokenVerifierMockDecode.mockReturnValue(undefined);

    await verifier.verifyToken("encoded-token");

    expect(authTokenVerifierMockCleanupKey).toHaveBeenCalledWith("raw-public-key-from-default-kid");
  });

  it("merges custom verify options with defaults", async () => {
    const verifier = new AuthTokenVerifier(authConfig);
    authTokenVerifierMockDecode.mockReturnValue({
      header: {
        kid: "decoded-kid",
      },
    });

    await verifier.verifyToken("encoded-token", {
      issuer: "issuer-1",
      algorithms: ["RS256"],
    });

    expect(authTokenVerifierMockVerify).toHaveBeenCalledWith("encoded-token", "clean-public-key", {
      algorithms: ["RS256"],
      issuer: "issuer-1",
    });
  });

  it("falls back to empty key when cleanupKey returns undefined", async () => {
    const verifier = new AuthTokenVerifier(authConfig);
    authTokenVerifierMockCleanupKey.mockReturnValue(undefined);
    authTokenVerifierMockDecode.mockReturnValue({
      header: {
        kid: "decoded-kid",
      },
    });

    await verifier.verifyToken("encoded-token");

    expect(authTokenVerifierMockVerify).toHaveBeenCalledWith("encoded-token", "", {
      algorithms: ["RS512"],
    });
  });
});
