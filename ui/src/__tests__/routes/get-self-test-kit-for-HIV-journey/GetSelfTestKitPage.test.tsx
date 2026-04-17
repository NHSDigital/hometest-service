import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { CreateOrderProvider, JourneyNavigationProvider } from "@/state";
import FormPageLayout from "@/layouts/FormPageLayout";
import GetSelfTestKitPage from "@/routes/get-self-test-kit-for-HIV-journey/GetSelfTestKitPage";
import { MemoryRouter } from "react-router-dom";

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/get-self-test-kit-for-HIV"]}>
    <JourneyNavigationProvider>
      <CreateOrderProvider>{children}</CreateOrderProvider>
    </JourneyNavigationProvider>
  </MemoryRouter>
);

describe("FormPageLayout", () => {
  it("renders without crashing", () => {
    render(
      <FormPageLayout>
        <div>Test content</div>
      </FormPageLayout>,
    );
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });
});

describe("GetSelfTestKitPage", () => {
  beforeEach(() => {
    render(<GetSelfTestKitPage />, { wrapper: TestWrapper });
  });

  it("renders the main heading", () => {
    expect(screen.getByRole("heading", { name: "Order a free HIV self-test kit" })).toBeInTheDocument();
  });

  it("renders the eligibility intro and list items", () => {
    expect(screen.getByText("You can use this service if:")).toBeInTheDocument();
    expect(screen.getByText("you're aged 18 or over")).toBeInTheDocument();
    expect(screen.getByText("the kit's available in your area")).toBeInTheDocument();
    expect(screen.getByText("you're ordering for yourself")).toBeInTheDocument();
  });

  it("renders the infoBox text", () => {
    expect(
      screen.getByText(/HIV can take up to 45 days after exposure/),
    ).toBeInTheDocument();
  });

  it("renders the how it works section", () => {
    expect(screen.getByRole("heading", { name: "How it works" })).toBeInTheDocument();
  });

  it("renders the results and timescales details summary", () => {
    expect(screen.getByText("Results and timescales")).toBeInTheDocument();
  });

  it("renders the data sharing details summary", () => {
    expect(screen.getByText("Who my information is shared with")).toBeInTheDocument();
  });

  it("renders the start now button", () => {
    expect(screen.getByRole("button", { name: "Start now" })).toBeInTheDocument();
  });
});
