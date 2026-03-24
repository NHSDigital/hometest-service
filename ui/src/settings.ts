const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const nhsLoginAuthorizeUrl =
  process.env.NEXT_PUBLIC_NHS_LOGIN_AUTHORIZE_URL ?? "https://auth.sandpit.signin.nhs.uk/authorize";
const useWiremockAuth = process.env.NEXT_PUBLIC_USE_WIREMOCK_AUTH === "true";

export { backendUrl, nhsLoginAuthorizeUrl, useWiremockAuth };
