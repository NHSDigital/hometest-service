import { NhsLoginClient } from "./nhs-login-client";
import { type HttpClient } from "../http/login-http-client";
import { type INhsLoginConfig } from "../models/nhs-login/nhs-login-config";
import { type INhsUserInfoResponseModel } from "../models/nhs-login/nhs-login-user-info-response-model";
import { type NhsLoginJwtHelper } from "./nhs-login-jwt-helper";
import { type JwksClient } from "jwks-rsa";
import * as testUserMapping from "./test-user-mapping";

function createUserInfo(
  overrides: Partial<INhsUserInfoResponseModel> = {},
): INhsUserInfoResponseModel {
  return {
    iss: "https://issuer.example",
    aud: "hometest",
    sub: "user-123",
    family_name: "MILLAR",
    given_name: "",
    identity_proofing_level: "P9",
    email: "test.user@example.com",
    email_verified: "true",
    phone_number_verified: "true",
    birthdate: "1990-01-01",
    nhs_number: "9999999999",
    gp_registration_details: {
      gp_ods_code: "A12345",
    },
    ...overrides,
  };
}

describe("NhsLoginClient.getUserInfo", () => {
  const nhsLoginConfig: INhsLoginConfig = {
    clientId: "client-id",
    expiresIn: 300,
    redirectUri: "https://example.com/callback",
    baseUri: "https://auth.example",
    privateKey: "private-key",
  };

  const jwtHelperMock = {
    createClientAuthJwt: jest.fn().mockReturnValue("signed-jwt"),
  } as unknown as NhsLoginJwtHelper;

  const jwksClientMock = {
    getSigningKey: jest.fn(),
  } as unknown as JwksClient;

  it("enriches user info when userinfo has missing given_name", async () => {
    const rawUserInfo = createUserInfo({ family_name: "MILLAR", given_name: "" });
    const httpClientMock: Pick<HttpClient, "getRequest" | "postRequest"> = {
      getRequest: jest.fn().mockResolvedValue(rawUserInfo),
      postRequest: jest.fn(),
    };

    const enrichSpy = jest.spyOn(testUserMapping, "enrichUserInfoWithTestFirstName");

    const client = new NhsLoginClient(
      nhsLoginConfig,
      jwtHelperMock,
      httpClientMock as unknown as HttpClient,
      jwksClientMock,
    );

    const result = await client.getUserInfo("access-token");

    expect(httpClientMock.getRequest).toHaveBeenCalledWith("https://auth.example/userinfo", {
      Authorization: "Bearer access-token",
    });
    expect(enrichSpy).toHaveBeenCalledWith(rawUserInfo);
    expect(result.given_name).toBe("Mona");

    enrichSpy.mockRestore();
  });

  it("returns user info without enrichment when given_name is present", async () => {
    const rawUserInfo = createUserInfo({ family_name: "MILLAR", given_name: "Eric" });
    const httpClientMock: Pick<HttpClient, "getRequest" | "postRequest"> = {
      getRequest: jest.fn().mockResolvedValue(rawUserInfo),
      postRequest: jest.fn(),
    };

    const enrichSpy = jest.spyOn(testUserMapping, "enrichUserInfoWithTestFirstName");

    const client = new NhsLoginClient(
      nhsLoginConfig,
      jwtHelperMock,
      httpClientMock as unknown as HttpClient,
      jwksClientMock,
    );

    const result = await client.getUserInfo("access-token");

    expect(httpClientMock.getRequest).toHaveBeenCalledWith("https://auth.example/userinfo", {
      Authorization: "Bearer access-token",
    });
    expect(enrichSpy).toHaveBeenCalledWith(rawUserInfo);
    expect(result.given_name).toBe("Eric");

    enrichSpy.mockRestore();
  });
});
