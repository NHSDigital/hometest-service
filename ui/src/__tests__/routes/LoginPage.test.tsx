import { render, waitFor } from "@testing-library/react";

import { getAuthorizeLoginHintFragment } from "@/lib/auth/loginHint";
import { generateState, persistLoginCsrf } from "@/lib/auth/loginState";
import LoginPage from "@/routes/LoginPage";

jest.mock("@/lib/auth/loginHint", () => ({
  getAuthorizeLoginHintFragment: jest.fn(),
}));

jest.mock("@/lib/auth/loginState", () => ({
  generateState: jest.fn(),
  persistLoginCsrf: jest.fn(),
}));

jest.mock("@/settings", () => ({
  nhsLoginAuthorizeUrl: "https://auth.example.test/authorize",
}));

const mockedGetAuthorizeLoginHintFragment = jest.mocked(getAuthorizeLoginHintFragment);
const mockedGenerateState = jest.mocked(generateState);
const mockedPersistLoginCsrf = jest.mocked(persistLoginCsrf);

describe("LoginPage", () => {
  let randomSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    // Stabilise the nonce so the useEffect is deterministic under JSDOM.
    randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.1234);
    mockedGetAuthorizeLoginHintFragment.mockReturnValue("&login_hint=stored-hint");
    mockedGenerateState.mockReturnValue({
      csrf: "csrf-token",
      encoded: "encoded-state",
    });
    globalThis.history.replaceState(
      {},
      "",
      "/login?returnTo=%2Forders%2F123&login_hint=user%40example.com",
    );
  });

  afterEach(() => {
    randomSpy.mockRestore();
    globalThis.history.replaceState({}, "", "/");
    jest.clearAllMocks();
  });

  it("builds an NHS Login redirect URL with the encoded return target", async () => {
    render(<LoginPage />);

    await waitFor(() => {
      expect(mockedGetAuthorizeLoginHintFragment).toHaveBeenCalledWith("user@example.com");
    });

    expect(mockedGenerateState).toHaveBeenCalledWith("/orders/123");
    expect(mockedPersistLoginCsrf).toHaveBeenCalledWith("csrf-token");
  });

  it("defaults returnTo to the root path when it is absent", async () => {
    mockedGetAuthorizeLoginHintFragment.mockReturnValue("");
    globalThis.history.replaceState({}, "", "/login");

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockedGenerateState).toHaveBeenCalledWith("/");
    });

    expect(mockedGetAuthorizeLoginHintFragment).toHaveBeenCalledWith(null);
  });
});
