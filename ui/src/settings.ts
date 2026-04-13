const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const nhsLoginAuthorizeUrl = process.env.NEXT_PUBLIC_NHS_LOGIN_AUTHORIZE_URL;
const useWiremockAuth = process.env.NEXT_PUBLIC_USE_WIREMOCK_AUTH === "true";
const nhsLoginClientId = process.env.NEXT_PUBLIC_NHS_LOGIN_CLIENT_ID;
const nhsLoginScope = process.env.NEXT_PUBLIC_NHS_LOGIN_SCOPE;

export { backendUrl, nhsLoginAuthorizeUrl, useWiremockAuth, nhsLoginClientId, nhsLoginScope };
