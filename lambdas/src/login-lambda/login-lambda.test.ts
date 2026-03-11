import type { APIGatewayProxyEvent } from "aws-lambda";

const mockInit = jest.fn();

jest.mock("./init", () => ({
  init: () => mockInit(),
}));

describe("login-lambda", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.AUTH_COOKIE_SAME_SITE = "Lax";
    mockInit.mockReset();
  });

  it("returns 400 when body is missing", async () => {
    mockInit.mockImplementation(async () => ({
      authTokenService: {
        generateAuthAccessToken: jest.fn(),
        generateAuthRefreshToken: jest.fn(),
      },
      loginService: {
        performLogin: jest.fn(),
      },
    }));

    const { lambdaHandler } = await import("./index");

    const event = { body: null } as APIGatewayProxyEvent;

    const res = await lambdaHandler(event);

    expect(res.statusCode).toBe(400);
    expect(res.body).toBe("Invalid request, missing body");
  });

  it("returns 400 when body is not a string", async () => {
    const performLogin = jest.fn();

    mockInit.mockImplementation(async () => ({
      authTokenService: {
        generateAuthAccessToken: jest.fn(),
        generateAuthRefreshToken: jest.fn(),
      },
      loginService: {
        performLogin,
      },
    }));

    const { lambdaHandler } = await import("./index");

    const event = { body: { code: "abc" } } as unknown as APIGatewayProxyEvent;
    const res = await lambdaHandler(event);

    expect(res.statusCode).toBe(400);
    expect(res.body).toBe("Invalid request, body must be a string");
    expect(performLogin).not.toHaveBeenCalled();
  });

  it("returns 200, user info, and Set-Cookie headers on success", async () => {
    const loginOutput = {
      nhsLoginAccessToken: "access-token",
      nhsLoginRefreshToken: "refresh-token",
      userInfoResponse: {
        sub: "user-123",
        nhs_number: "9686368973",
        birthdate: "1968-02-12",
        family_name: "MILLAR",
        email: "testuser@example.com",
        phone_number: "+447887510886",
      },
    };

    mockInit.mockImplementation(async () => ({
      authTokenService: {
        generateAuthAccessToken: jest.fn().mockReturnValue("signed-access"),
        generateAuthRefreshToken: jest.fn().mockReturnValue("signed-refresh"),
      },
      loginService: {
        performLogin: jest.fn().mockImplementation(async () => loginOutput),
      },
    }));

    const { lambdaHandler } = await import("./index");

    const event = { body: JSON.stringify({ code: "abc" }) } as APIGatewayProxyEvent;
    const res = await lambdaHandler(event);

    expect(res.statusCode).toBe(200);
  });
});
