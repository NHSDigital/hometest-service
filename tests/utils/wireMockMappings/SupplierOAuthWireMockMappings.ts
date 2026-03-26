import type { WireMockMapping } from "../../api/clients/WireMockClient";

interface SupplierOAuthMappingOptions {
  priority?: number;
  accessToken?: string;
  expiresIn?: number;
}

export function createSupplierOAuthTokenMapping(
  options: Partial<SupplierOAuthMappingOptions> = {},
): WireMockMapping {
  return {
    priority: options.priority ?? 10,
    request: {
      method: "POST",
      urlPathPattern: "/(api/oauth|oauth/token)",
      headers: {
        "Content-Type": {
          contains: "application/x-www-form-urlencoded",
        },
      },
      bodyPatterns: [
        {
          matches: ".*grant_type=client_credentials.*",
        },
        {
          matches: ".*client_id=.*",
        },
        {
          matches: ".*client_secret=.*",
        },
      ],
    },
    response: {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
      jsonBody: {
        access_token:
          options.accessToken ??
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdXBwbGllcl9jbGllbnQiLCJzY29wZSI6Im9yZGVycyByZXN1bHRzIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.mock-signature", // gitleaks:allow
        token_type: "Bearer",
        expires_in: options.expiresIn ?? 3600,
        scope: "orders results",
      },
    },
  };
}

export function createSupplierOAuthInvalidCredentialsMapping(
  options: { priority?: number } = {},
): WireMockMapping {
  return {
    priority: options.priority ?? 9,
    request: {
      method: "POST",
      urlPathPattern: "/(api/oauth|oauth/token)",
      headers: {
        "Content-Type": {
          contains: "application/x-www-form-urlencoded",
        },
      },
      bodyPatterns: [
        {
          matches: ".*client_id=invalid.*",
        },
      ],
    },
    response: {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": 'Bearer realm="OAuth"',
      },
      jsonBody: {
        error: "invalid_client",
        error_description: "Client authentication failed",
      },
    },
  };
}

/**
 * Creates a WireMock mapping for supplier OAuth invalid grant type
 */
export function createSupplierOAuthInvalidGrantTypeMapping(
  options: { priority?: number } = {},
): WireMockMapping {
  return {
    priority: options.priority ?? 8,
    request: {
      method: "POST",
      urlPathPattern: "/(api/oauth|oauth/token)",
      headers: {
        "Content-Type": {
          contains: "application/x-www-form-urlencoded",
        },
      },
      bodyPatterns: [
        {
          matches: ".*grant_type=(?!client_credentials).*",
        },
      ],
    },
    response: {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
      jsonBody: {
        error: "unsupported_grant_type",
        error_description: "The authorization grant type is not supported",
      },
    },
  };
}

export function createSupplierOAuthMissingParamsMapping(
  options: { priority?: number } = {},
): WireMockMapping {
  return {
    priority: options.priority ?? 7,
    request: {
      method: "POST",
      urlPathPattern: "/(api/oauth|oauth/token)",
      headers: {
        "Content-Type": {
          contains: "application/x-www-form-urlencoded",
        },
      },
    },
    response: {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
      jsonBody: {
        error: "invalid_request",
        error_description: "Missing required parameter: client_id or client_secret",
      },
    },
  };
}
