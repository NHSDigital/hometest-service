import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import FormPageLayout from "@/layouts/FormPageLayout";
import { RoutePath } from "@/lib/models/route-paths";
import GetSelfTestKitPage from "@/routes/get-self-test-kit-for-HIV-journey/GetSelfTestKitPage";
import { CreateOrderProvider, JourneyNavigationProvider } from "@/state";

const mockGoToStep = jest.fn();
const mockGoBack = jest.fn();
const mockNavigationContext = {
  goToStep: mockGoToStep,
  goBack: mockGoBack,
  canGoBack: jest.fn(),
  stepHistory: ["/get-self-test-kit-for-HIV"] as string[],
  currentStep: "/get-self-test-kit-for-HIV",
};

const mockUpdateOrderAnswers = jest.fn();

jest.mock("@/state", () => ({
  ...jest.requireActual("@/state"),
  useJourneyNavigationContext: () => mockNavigationContext,
  useCreateOrderContext: () => ({
    updateOrderAnswers: mockUpdateOrderAnswers,
    orderAnswers: {},
  }),
}));

jest.mock("@/layouts/FormPageLayout", () => ({
  __esModule: true,
  default: ({
    children,
    showBackButton,
    onBackButtonClick,
  }: {
    children: React.ReactNode;
    showBackButton?: boolean;
    onBackButtonClick?: () => void;
  }) => (
    <div>
      {showBackButton && <button onClick={onBackButtonClick}>Back</button>}
      {children}
    </div>
  ),
}));

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
    jest.clearAllMocks();
    mockNavigationContext.stepHistory = ["/get-self-test-kit-for-HIV"];
    render(<GetSelfTestKitPage />, { wrapper: TestWrapper });
  });

  it("renders the main heading", () => {
    expect(
      screen.getByRole("heading", { name: "Order a free HIV self-test kit" }),
    ).toBeInTheDocument();
  });

  it("renders the eligibility intro and list items", () => {
    expect(screen.getByText("You can use this service if:")).toBeInTheDocument();
    expect(screen.getByText("you're aged 18 or over")).toBeInTheDocument();
    expect(screen.getByText("the kit's available in your area")).toBeInTheDocument();
    expect(screen.getByText("you're ordering for yourself")).toBeInTheDocument();
  });

  it("renders the infoBox text", () => {
    expect(screen.getByText(/HIV can take up to 45 days after exposure/)).toBeInTheDocument();
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

  it("sets the document title", () => {
    expect(document.title).toBe("Order a free HIV self-test kit - HomeTest - NHS");
  });
});

describe("GetSelfTestKitPage back button", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls goBack when stepHistory has more than one entry", () => {
    mockNavigationContext.stepHistory = ["/get-self-test-kit-for-HIV", "enter-delivery-address"];
    render(<GetSelfTestKitPage />, { wrapper: TestWrapper });
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(mockGoToStep).not.toHaveBeenCalled();
  });

  it("navigates to BeforeYouStartPage when stepHistory has one entry", () => {
    mockNavigationContext.stepHistory = ["/get-self-test-kit-for-HIV"];
    render(<GetSelfTestKitPage />, { wrapper: TestWrapper });
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(mockGoToStep).toHaveBeenCalledWith(RoutePath.BeforeYouStartPage);
    expect(mockGoBack).not.toHaveBeenCalled();
  });
});
