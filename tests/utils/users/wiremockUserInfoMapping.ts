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
        family_name: "MILLAR",
        given_name: "Mona",
        identity_proofing_level: "P9",
        email: `wiremock-${user.nhsNumber}@example.com`,
        email_verified: "true",
        phone_number: "+447700900000",
        phone_number_verified: "true",
        birthdate: user.dob,
        nhs_number: user.nhsNumber,
        gp_registration_details: {
          gp_ods_code: "Y12345",
        },
      },
    },
  };
}
