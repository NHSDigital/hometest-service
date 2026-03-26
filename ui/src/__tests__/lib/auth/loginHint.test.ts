async function loadLoginHintModule(
  useWiremockAuth: boolean,
): Promise<typeof import("@/lib/auth/loginHint")> {
  jest.resetModules();
  jest.doMock("@/settings", () => ({ useWiremockAuth }));

  return import("@/lib/auth/loginHint");
}

describe("getAuthorizeLoginHintFragment", () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns an empty fragment when wiremock auth is disabled", async () => {
    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

    const { getAuthorizeLoginHintFragment } = await loadLoginHintModule(false);

    expect(getAuthorizeLoginHintFragment("user@example.com")).toBe("");
    expect(setItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });

  it("persists and encodes the login hint from the query string", async () => {
    const { getAuthorizeLoginHintFragment } = await loadLoginHintModule(true);

    expect(getAuthorizeLoginHintFragment("user+test@example.com")).toBe(
      "&login_hint=user%2Btest%40example.com",
    );
    expect(globalThis.localStorage.getItem("wiremockLoginHint")).toBe("user+test@example.com");
  });

  it("reuses a stored login hint when no query hint is provided", async () => {
    globalThis.localStorage.setItem("wiremockLoginHint", "stored hint");

    const { getAuthorizeLoginHintFragment } = await loadLoginHintModule(true);

    expect(getAuthorizeLoginHintFragment(null)).toBe("&login_hint=stored%20hint");
  });

  it("returns an empty fragment when no login hint is available", async () => {
    const { getAuthorizeLoginHintFragment } = await loadLoginHintModule(true);

    expect(getAuthorizeLoginHintFragment(null)).toBe("");
  });
});
