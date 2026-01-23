import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import GetSelfTestKitPage from "@/app/get-self-test-kit-for-HIV/page";
import { PageLayout } from "@/components/PageLayout";

// Mock Next.js router and Link
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = "MockLink";
  return MockLink;
});

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
    render(<GetSelfTestKitPage />);

    const header = screen.getByRole("heading", {
      name: "Get a self-test kit for HIV",
    });
    expect(header).toBeInTheDocument();
  });
});
