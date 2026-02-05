import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { CreateOrderProvider } from "@/state/OrderContext";
import GetSelfTestKitPage from "@/routes/get-self-test-kit-for-HIV-journey/GetSelfTestKitPage";
import { JourneyNavigationProvider } from "@/state/NavigationContext";
import { MemoryRouter } from "react-router-dom";
import PageLayout from "@/layouts/PageLayout";

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/get-self-test-kit-for-HIV"]}>
    <JourneyNavigationProvider>
      <CreateOrderProvider>{children}</CreateOrderProvider>
    </JourneyNavigationProvider>
  </MemoryRouter>
);

describe('PageLayout', () => {
  it('renders without crashing', () => {
    render(
      <PageLayout>
        <div>Test content</div>
      </PageLayout>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
});

describe("GetSelfTestKitPage", () => {
  it("renders the main header", () => {
    render(<GetSelfTestKitPage />, { wrapper: TestWrapper });

    const header = screen.getByRole("heading", {
      name: "Get a self-test kit for HIV",
    });
    expect(header).toBeInTheDocument();
  });
});
