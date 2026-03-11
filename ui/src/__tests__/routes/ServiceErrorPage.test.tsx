import "@testing-library/jest-dom";

import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import ServiceErrorPage from "@/routes/ServiceErrorPage";

jest.mock("@/hooks", () => ({
  useContent: () => ({
    "service-error": {
      title: "Sorry, there is a problem with the service",
      message: "Try again later.",
    },
  }),
}));

jest.mock("@/layouts/PageLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-layout">{children}</div>
  ),
}));

const renderWithState = (state?: Record<string, unknown>) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: "/service-error", state }]}>
      <ServiceErrorPage />
    </MemoryRouter>,
  );

describe("ServiceErrorPage", () => {
  it("renders the error title and message", () => {
    renderWithState();

    expect(
      screen.getByRole("heading", { name: "Sorry, there is a problem with the service" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Try again later.")).toBeInTheDocument();
  });

  it("renders inside the page layout", () => {
    renderWithState();

    expect(screen.getByTestId("page-layout")).toBeInTheDocument();
  });

  it("renders the error page container", () => {
    const { container } = renderWithState();

    expect(container.querySelector("#error-page")).toBeInTheDocument();
  });

  it("logs the error message to the console when state contains errorMessage", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    renderWithState({ errorMessage: "Something went wrong" });

    expect(consoleSpy).toHaveBeenCalledWith(
      "[ServiceErrorPage]",
      "Something went wrong",
    );

    consoleSpy.mockRestore();
  });

  it("does not log to the console when there is no errorMessage in state", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    renderWithState();

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
