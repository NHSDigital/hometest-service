import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import { NhsLoginJwtHelper } from "./nhs-login-jwt-helper";

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    sign: jest.fn(),
  },
}));

jest.mock("uuid", () => ({
  v4: jest.fn(),
}));

const mockSign = jwt.sign as jest.Mock;
const mockUuid = uuidv4 as jest.Mock;

describe("NhsLoginJwtHelper", () => {
  const nhsLoginConfig = {
    clientId: "client-id",
    expiresIn: 300,
    redirectUri: "https://example.com/callback",
    baseUri: "https://auth.example",
    privateKey: "private-key",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUuid.mockReturnValue("uuid-1234");
    mockSign.mockReturnValue("signed-client-auth-jwt");
  });

  it("creates a signed client auth jwt with expected claims", () => {
    const helper = new NhsLoginJwtHelper(nhsLoginConfig);

    const token = helper.createClientAuthJwt();

    expect(mockUuid).toHaveBeenCalledTimes(1);
    expect(mockSign).toHaveBeenCalledWith({}, "private-key", {
      algorithm: "RS512",
      subject: "client-id",
      issuer: "client-id",
      audience: "https://auth.example/token",
      jwtid: "uuid-1234",
      expiresIn: 300,
    });
    expect(token).toBe("signed-client-auth-jwt");
  });

  it("uses configured baseUri when building token audience", () => {
    const helper = new NhsLoginJwtHelper({
      ...nhsLoginConfig,
      baseUri: "https://another-auth.example",
    });

    helper.createClientAuthJwt();

    expect(mockSign).toHaveBeenCalledWith(
      {},
      "private-key",
      expect.objectContaining({
        audience: "https://another-auth.example/token",
      }),
    );
  });
});
