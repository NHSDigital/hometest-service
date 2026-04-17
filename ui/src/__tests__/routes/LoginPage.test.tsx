import { render, waitFor } from "@testing-library/react";

import { getAuthorizeLoginHintFragment } from "@/lib/auth/loginHint";
import { generateState, persistLoginCsrf } from "@/lib/auth/loginState";
import { RoutePath } from "@/lib/models/route-paths";

const mockNavigate = jest.fn();

jest.mock("@/lib/auth/loginHint", () => ({
  getAuthorizeLoginHintFragment: jest.fn(),
}));

jest.mock("@/lib/auth/loginState", () => ({
  generateState: jest.fn(),
  persistLoginCsrf: jest.fn(),
}));

jest.mock("@/settings", () => {
  const values = {
    nhsLoginAuthorizeUrl: "https://auth.example.test/authorize",
    nhsLoginClientId: "hometest",
    nhsLoginScope: "openid profile email phone",
  };

  return {
    __esModule: true,
    get nhsLoginAuthorizeUrl() {
      return values.nhsLoginAuthorizeUrl;
    },
    get nhsLoginClientId() {
      return values.nhsLoginClientId;
    },
    get nhsLoginScope() {
      return values.nhsLoginScope;
    },
    __setMockSettings(
      nextValues: Partial<{
        nhsLoginAuthorizeUrl: string;
        nhsLoginClientId: string;
        nhsLoginScope: string;
      }>,
    ) {
      Object.assign(values, nextValues);
    },
  };
});

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockedGetAuthorizeLoginHintFragment = jest.mocked(getAuthorizeLoginHintFragment);
const mockedGenerateState = jest.mocked(generateState);
const mockedPersistLoginCsrf = jest.mocked(persistLoginCsrf);

interface MockedSettingsModule {
  __setMockSettings: (
    nextValues: Partial<{
      nhsLoginAuthorizeUrl: string;
      nhsLoginClientId: string;
      nhsLoginScope: string;
    }>,
  ) => void;
}

const mockedSettings = jest.requireMock("@/settings") as MockedSettingsModule;

describe("LoginPage", () => {
  beforeEach(() => {
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
    globalThis.history.replaceState({}, "", "/");
    mockedSettings.__setMockSettings({
      nhsLoginAuthorizeUrl: "https://auth.example.test/authorize",
      nhsLoginClientId: "hometest",
      nhsLoginScope: "openid profile email phone",
    });
    jest.clearAllMocks();
  });

  it("builds an NHS Login redirect URL with the encoded return target", async () => {
    const { default: LoginPage } = await import("@/routes/LoginPage");
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
    const { default: LoginPage } = await import("@/routes/LoginPage");

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockedGenerateState).toHaveBeenCalledWith("/");
    });

    expect(mockedGetAuthorizeLoginHintFragment).toHaveBeenCalledWith(null);
  });

  it("navigates to service error and skips redirect URL generation when config is missing", async () => {
    mockedSettings.__setMockSettings({ nhsLoginClientId: "" });
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const { default: LoginPage } = await import("@/routes/LoginPage");

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(RoutePath.ServiceErrorPage, {
        replace: true,
        state: {
          errorMessage:
            "Missing NHS Login configuration. Ensure NEXT_PUBLIC_NHS_LOGIN_AUTHORIZE_URL, NEXT_PUBLIC_NHS_LOGIN_CLIENT_ID, and NEXT_PUBLIC_NHS_LOGIN_SCOPE are set.",
        },
      });
    });

    expect(mockedGetAuthorizeLoginHintFragment).not.toHaveBeenCalled();
    expect(mockedGenerateState).not.toHaveBeenCalled();
    expect(mockedPersistLoginCsrf).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
