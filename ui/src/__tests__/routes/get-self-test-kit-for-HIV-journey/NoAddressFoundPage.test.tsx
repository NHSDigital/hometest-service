import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { CreateOrderProvider, JourneyNavigationProvider } from "@/state";
import { MemoryRouter } from "react-router-dom";
import NoAddressFoundPage from "@/routes/get-self-test-kit-for-HIV-journey/NoAddressFoundPage";

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/get-self-test-kit-for-HIV/no-address-found"]}>
    <JourneyNavigationProvider>
      <CreateOrderProvider>{children}</CreateOrderProvider>
    </JourneyNavigationProvider>
  </MemoryRouter>
);

describe("NoAddressFoundPage", () => {
  describe("Component Rendering", () => {
    it("renders the main heading", () => {
      render(<NoAddressFoundPage />, { wrapper: TestWrapper });

      const heading = screen.getByRole("heading", {
        name: "No address found",
      });
      expect(heading).toBeInTheDocument();
    });

    it("renders the try new search link", () => {
      render(<NoAddressFoundPage />, { wrapper: TestWrapper });

      const link = screen.getByText("Try a new search");
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe("A");
    });

    it("renders the enter address manually link", () => {
      render(<NoAddressFoundPage />, { wrapper: TestWrapper });

      const link = screen.getByText("Enter address manually");
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe("A");
    });
  });
});
