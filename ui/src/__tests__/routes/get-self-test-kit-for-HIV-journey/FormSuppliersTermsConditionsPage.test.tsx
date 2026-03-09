import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";

import FormSuppliersTermsConditionsPage from "@/routes/get-self-test-kit-for-HIV-journey/FormSuppliersTermsConditionsPage";

const mockUseJourneyNavigationContext = jest.fn();
const mockUseCreateOrderContext = jest.fn();
const mockSuppliersTermsConditionsContent = jest.fn(
  ({ supplier }: { supplier?: string | null }) => (
    <div data-testid="suppliers-terms-content">Supplier: {supplier ?? "missing"}</div>
  ),
);
const mockFormPageLayout = jest.fn(
  ({
    children,
    onBackButtonClick,
  }: {
    children: React.ReactNode;
    onBackButtonClick: () => void;
  }) => (
    <div data-testid="form-page-layout">
      <button onClick={onBackButtonClick}>Back</button>
      {children}
    </div>
  ),
);

jest.mock("@/state", () => ({
  useJourneyNavigationContext: () => mockUseJourneyNavigationContext(),
  useCreateOrderContext: () => mockUseCreateOrderContext(),
}));

jest.mock("@/layouts/FormPageLayout", () => ({
  __esModule: true,
  default: (props: {
    showBackButton?: boolean;
    children: React.ReactNode;
    onBackButtonClick: () => void;
  }) => mockFormPageLayout(props),
}));

jest.mock("@/components/SuppliersTermsConditionsContent", () => ({
  SuppliersTermsConditionsContent: (props: { supplier?: string | null }) =>
    mockSuppliersTermsConditionsContent(props),
}));

describe("HIV journey FormSuppliersTermsConditionsPage", () => {
  const mockGoToStep = jest.fn();
  const mockGoBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseCreateOrderContext.mockReturnValue({
      orderAnswers: {
        supplier: [{ name: "Preventx" }],
      },
    });

    mockUseJourneyNavigationContext.mockReturnValue({
      goToStep: mockGoToStep,
      goBack: mockGoBack,
      stepHistory: ["how-comfortable-pricking-finger", "suppliers-terms-conditions"],
    });
  });

  it("passes supplier from order answers to shared content component", () => {
    render(<FormSuppliersTermsConditionsPage />);

    expect(screen.getByTestId("suppliers-terms-content")).toHaveTextContent("Supplier: Preventx");
    expect(mockSuppliersTermsConditionsContent).toHaveBeenCalledWith({ supplier: "Preventx" });
  });

  it("shows layout with back button enabled", () => {
    render(<FormSuppliersTermsConditionsPage />);

    expect(screen.getByTestId("form-page-layout")).toBeInTheDocument();
    expect(mockFormPageLayout).toHaveBeenCalledWith(
      expect.objectContaining({ showBackButton: true }),
    );
  });

  it("goes back when history has previous steps", () => {
    render(<FormSuppliersTermsConditionsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(mockGoToStep).not.toHaveBeenCalled();
  });

  it("goes to check-your-answers when no previous step exists", () => {
    mockUseJourneyNavigationContext.mockReturnValue({
      goToStep: mockGoToStep,
      goBack: mockGoBack,
      stepHistory: ["suppliers-terms-conditions"],
    });

    render(<FormSuppliersTermsConditionsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(mockGoBack).not.toHaveBeenCalled();
    expect(mockGoToStep).toHaveBeenCalledWith("check-your-answers");
  });

  it("passes undefined supplier when supplier is not selected", () => {
    mockUseCreateOrderContext.mockReturnValue({
      orderAnswers: {},
    });

    render(<FormSuppliersTermsConditionsPage />);

    expect(screen.getByTestId("suppliers-terms-content")).toHaveTextContent("Supplier: missing");
    expect(mockSuppliersTermsConditionsContent).toHaveBeenCalledWith({ supplier: undefined });
  });
});
