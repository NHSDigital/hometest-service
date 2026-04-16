import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { act } from "react";

import ErrorRedirect from "@/components/ErrorRedirect";

const mockNavigate = jest.fn();
const mockUseRouteError = jest.fn();
const mockIsRouteErrorResponse = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useRouteError: () => mockUseRouteError(),
  isRouteErrorResponse: (...args: unknown[]) => mockIsRouteErrorResponse(...args),
}));

describe("ErrorRedirect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsRouteErrorResponse.mockReturnValue(false);
  });

  it("renders nothing", () => {
    mockUseRouteError.mockReturnValue(new Error("test"));

    const { container } = render(<ErrorRedirect />);

    expect(container.firstChild).toBeNull();
  });

  it("navigates to the service error page with the Error message", async () => {
    mockUseRouteError.mockReturnValue(new Error("Something broke"));

    await act(async () => {
      render(<ErrorRedirect />);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/service-error", {
      replace: true,
      state: { errorMessage: "Something broke" },
    });
  });

  it("navigates with status and statusText for a route error response", async () => {
    const routeError = { status: 404, statusText: "Not Found", data: null };
    mockUseRouteError.mockReturnValue(routeError);
    mockIsRouteErrorResponse.mockReturnValue(true);

    await act(async () => {
      render(<ErrorRedirect />);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/service-error", {
      replace: true,
      state: { errorMessage: "404 Not Found" },
    });
  });

  it("navigates with a fallback message for an unknown error type", async () => {
    mockUseRouteError.mockReturnValue("some unknown error string");

    await act(async () => {
      render(<ErrorRedirect />);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/service-error", {
      replace: true,
      state: { errorMessage: "An unexpected error occurred" },
    });
  });
});
