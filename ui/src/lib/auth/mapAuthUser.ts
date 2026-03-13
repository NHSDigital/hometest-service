import { AuthUser } from "@/state";

interface AuthUserApiData {
  sub: string;
  nhs_number: string;
  birthdate: string;
  email: string;
  identity_proofing_level: string;
  phone_number: string;
  family_name: string;
  // it will empty because of missing scope
  given_name: string;
}

export function mapAuthUser(data: AuthUserApiData): AuthUser {
  return {
    sub: data.sub,
    nhsNumber: data.nhs_number,
    birthdate: data.birthdate,
    identityProofingLevel: data.identity_proofing_level,
    phoneNumber: data.phone_number,
    familyName: data.family_name,
    givenName: data.given_name,
    email: data.email,
  };
}
