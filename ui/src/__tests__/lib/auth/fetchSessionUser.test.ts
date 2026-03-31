const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const originalFetch = globalThis.fetch;

beforeAll(() => {
  globalThis.fetch = mockFetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

async function loadFetchSessionUserModule(
  backendUrl: string | undefined,
): Promise<typeof import("@/lib/auth/fetchSessionUser")> {
  jest.resetModules();
  jest.doMock("@/settings", () => ({ backendUrl }));

  return import("@/lib/auth/fetchSessionUser");
}

describe("fetchSessionUser", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("throws when the backend URL is missing", async () => {
    const { fetchSessionUser } = await loadFetchSessionUserModule(undefined);

    await expect(fetchSessionUser()).rejects.toThrow("Missing NEXT_PUBLIC_BACKEND_URL");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("throws when the backend URL is blank whitespace", async () => {
    const { fetchSessionUser } = await loadFetchSessionUserModule("   ");

    await expect(fetchSessionUser()).rejects.toThrow("Missing NEXT_PUBLIC_BACKEND_URL");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("throws a session unauthenticated error on 401 responses", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    const { fetchSessionUser } = await loadFetchSessionUserModule("http://backend.test");

    await expect(fetchSessionUser()).rejects.toMatchObject({
      message: "Unauthenticated session",
      name: "SessionUnauthenticatedError",
    });
  });

  it("throws an HTTP status error for other non-success responses", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);

    const { fetchSessionUser } = await loadFetchSessionUserModule("http://backend.test");

    await expect(fetchSessionUser()).rejects.toThrow("Session check failed: HTTP 503");
  });

  it("fetches the session and maps the user payload", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        sub: "test-user-123",
        nhs_number: "9876543210",
        birthdate: "1985-05-15",
        email: "john.smith@example.com",
        identity_proofing_level: "P9",
        phone_number: "07700900123",
        family_name: "Smith",
        given_name: "John",
      }),
    } as Response);

    const { fetchSessionUser } = await loadFetchSessionUserModule("http://backend.test");

    await expect(fetchSessionUser()).resolves.toEqual({
      sub: "test-user-123",
      nhsNumber: "9876543210",
      birthdate: "1985-05-15",
      email: "john.smith@example.com",
      identityProofingLevel: "P9",
      phoneNumber: "07700900123",
      familyName: "Smith",
      givenName: "John",
    });
    expect(mockFetch).toHaveBeenCalledWith("http://backend.test/session", {
      method: "GET",
      credentials: "include",
    });
  });
});
