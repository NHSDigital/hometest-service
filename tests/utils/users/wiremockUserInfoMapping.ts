import type { WireMockMapping } from "../../api/clients/WireMockClient";
import type { NHSLoginMockedUser } from "./BaseUser";

export function createWireMockUserInfoMapping(
  user: NHSLoginMockedUser,
  accessToken?: string,
  sub: string = "test-sub-123",
): WireMockMapping {
  return {
    priority: 1,
    request: {
      method: "GET",
      urlPath: "/userinfo",
      headers: {
        Authorization: {
          ...(accessToken ? { equalTo: `Bearer ${accessToken}` } : { matches: "Bearer .*" }),
        },
      },
    },
    response: {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
      jsonBody: {
        iss: "http://wiremock:8080",
        aud: "hometest",
        sub,
        family_name: user.familyName ?? "MILLAR",
        given_name: user.givenName ?? "Mona",
        identity_proofing_level: user.identityProofingLevel ?? "P9",
        email: user.email ?? `wiremock-${user.nhsNumber}@example.com`,
        email_verified: "true",
        phone_number: user.phoneNumber ?? "+447700900000",
        phone_number_verified: "true",
        birthdate: user.dob,
        nhs_number: user.nhsNumber,
        gp_registration_details: {
          gp_ods_code: user.gpOdsCode ?? "Y12345",
        },
      },
    },
  };
}
