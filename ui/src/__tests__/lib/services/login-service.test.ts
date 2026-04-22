import { mapAuthUser } from "@/lib/auth/mapAuthUser";
import loginService from "@/lib/services/login-service";
import type { AuthUser } from "@/state";

jest.mock("@/settings", () => ({ backendUrl: "http://mock-backend" }));
jest.mock("@/lib/auth/mapAuthUser", () => ({ mapAuthUser: jest.fn() }));

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as typeof fetch;

const mockedMapAuthUser = jest.mocked(mapAuthUser);

describe("LoginService", () => {
  const apiUrl = "http://mock-backend/login";

  const apiUser = {
    sub: "user-123",
    nhs_number: "9686368973",
    birthdate: "1968-02-12",
    email: "test@example.com",
    identity_proofing_level: "P9",
    phone_number: "+447887510886",
    family_name: "MILLAR",
    given_name: "Alice",
  };

  const mappedUser: AuthUser = {
    sub: "user-123",
    nhsNumber: "9686368973",
    birthdate: "1968-02-12",
    email: "test@example.com",
    identityProofingLevel: "P9",
    phoneNumber: "+447887510886",
    familyName: "MILLAR",
    givenName: "Alice",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedMapAuthUser.mockReturnValue(mappedUser);
  });

  it("calls the login endpoint with the auth code and returns the mapped user", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => apiUser,
    });

    const result = await loginService.login("abc123");

    expect(result).toEqual(mappedUser);
    expect(mockFetch).toHaveBeenCalledWith(
      apiUrl,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ code: "abc123" }),
        credentials: "include",
      }),
    );
    expect(mockedMapAuthUser).toHaveBeenCalledWith(apiUser);
  });

  it("throws when the login endpoint returns a non-OK response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    await expect(loginService.login("bad-code")).rejects.toThrow("HTTP 401: Unauthorized");
  });

  it("throws when the login endpoint returns a 500 response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    await expect(loginService.login("any-code")).rejects.toThrow("HTTP 500: Internal Server Error");
  });

  it("throws when NEXT_PUBLIC_BACKEND_URL is not configured", async () => {
    jest.resetModules();
    jest.doMock("@/settings", () => ({ backendUrl: "" }));

    const { default: freshLoginService } = await import("@/lib/services/login-service");

    await expect(freshLoginService.login("abc123")).rejects.toThrow(
      "Missing NEXT_PUBLIC_BACKEND_URL",
    );
  });
});
