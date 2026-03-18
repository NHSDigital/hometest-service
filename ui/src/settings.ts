const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const nhsLoginAuthorizeUrl =
  process.env.NEXT_PUBLIC_NHS_LOGIN_AUTHORIZE_URL ?? "https://auth.sandpit.signin.nhs.uk/authorize";

export { backendUrl, nhsLoginAuthorizeUrl };
