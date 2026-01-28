import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import NoAddressFoundPage from "@/app/no-address-found/page";
import { OrderProvider } from "@/state/OrderContext";
import { NavigationProvider } from "@/state/NavigationContext";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => "/no-address-found",
}));

jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = "MockLink";
  return MockLink;
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationProvider>
    <OrderProvider>{children}</OrderProvider>
  </NavigationProvider>
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

      const link = screen.getByRole("link", { name: "Try a new search" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "enter-delivery-address");
    });

    it("renders the enter address manually link", () => {
      render(<NoAddressFoundPage />, { wrapper: TestWrapper });

      const link = screen.getByRole("link", { name: "Enter address manually" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "enter-address-manually");
    });
  });
});
