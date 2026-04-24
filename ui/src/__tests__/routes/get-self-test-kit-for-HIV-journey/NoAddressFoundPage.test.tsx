import "@testing-library/jest-dom";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import NoAddressFoundPage from "@/routes/get-self-test-kit-for-HIV-journey/NoAddressFoundPage";
import { CreateOrderProvider, JourneyNavigationProvider } from "@/state";

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/get-self-test-kit-for-HIV/no-address-found"]}>
    <JourneyNavigationProvider>
      <CreateOrderProvider>{children}</CreateOrderProvider>
    </JourneyNavigationProvider>
  </MemoryRouter>
);

describe("NoAddressFoundPage", () => {
  describe("Component Rendering", () => {
    beforeEach(() => {
      render(<NoAddressFoundPage />, { wrapper: TestWrapper });
    });

    afterEach(() => {
      cleanup();
    });

    it("renders the main heading", () => {
      const heading = screen.getByRole("heading", {
        name: "No address found",
      });
      expect(heading).toBeInTheDocument();
    });

    it("renders the try new search link", () => {
      const link = screen.getByText("Try a new search");
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe("A");
    });

    it("renders the enter address manually link", () => {
      const link = screen.getByText("Enter address manually");
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe("A");
    });
  });

  it("sets the document title", () => {
    render(<NoAddressFoundPage />, { wrapper: TestWrapper });

    expect(document.title).toBe("No address found – HIV Home Test Service – NHS");
  });
});
