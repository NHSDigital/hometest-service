import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import GetSelfTestKitPage from "@/app/(journeys)/get-self-test-kit-for-HIV/page";
import { PageLayout } from "@/components/PageLayout";
import { CreateOrderProvider } from "@/state/OrderContext";
import { JourneyNavigationProvider } from "@/state/NavigationContext";

// Mock Next.js router and Link
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => "/get-self-test-kit-for-HIV",
}));

jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = "MockLink";
  return MockLink;
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <JourneyNavigationProvider>
    <CreateOrderProvider>{children}</CreateOrderProvider>
  </JourneyNavigationProvider>
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
