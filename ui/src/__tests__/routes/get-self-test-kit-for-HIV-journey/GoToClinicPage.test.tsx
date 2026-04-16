import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { usePageContent } from "@/hooks";
import GoToClinicPage from "@/routes/get-self-test-kit-for-HIV-journey/GoToClinicPage";

const mockGoToStep = jest.fn();
const mockGoBack = jest.fn();

const mockNavigationContext = {
  goToStep: mockGoToStep,
  goBack: mockGoBack,
  stepHistory: ["how-comfortable-pricking-finger", "go-to-clinic"],
};

const mockCreateOrderContext = {
  orderAnswers: {
    postcodeSearch: "LS1 1AB",
  },
};

jest.mock("@/state", () => ({
  useJourneyNavigationContext: () => mockNavigationContext,
  useCreateOrderContext: () => mockCreateOrderContext,
}));

jest.mock("@/hooks", () => ({
  usePageContent: jest.fn(),
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

jest.mock("@/components/NearestSexualHealthClinicSection", () => ({
  NearestSexualHealthClinicSection: () => <div data-testid="nearest-sexual-health-clinic" />,
}));

jest.mock("@/components/FindAnotherSexualHealthClinicLink", () => ({
  FindAnotherSexualHealthClinicLink: () => <div data-testid="find-another-clinic-link" />,
}));

jest.mock("@/components/LearnMoreAboutHivAndAidsLink", () => ({
  LearnMoreAboutHivAndAidsLink: () => <div data-testid="learn-more-hiv-aids-link" />,
}));

jest.mock("@/components/FeedbackSection", () => ({
  FeedbackSection: () => <div data-testid="feedback-section" />,
}));

describe("GoToClinicPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigationContext.stepHistory = ["how-comfortable-pricking-finger", "go-to-clinic"];

    (usePageContent as jest.Mock).mockReturnValue({
      title: "Contact your nearest sexual health clinic",
      moreOptionsHeading: "More options and information",
    });
  });

  describe("Component Rendering", () => {
    it("renders the title", () => {
      render(<GoToClinicPage />);

      expect(
        screen.getByRole("heading", {
          name: "Contact your nearest sexual health clinic",
        }),
      ).toBeInTheDocument();

      expect(screen.getByText("More options and information")).toBeInTheDocument();
    });
  });

  describe("Back button behavior", () => {
    it("calls goBack when there is history", () => {
      render(<GoToClinicPage />);

      fireEvent.click(screen.getByRole("button", { name: "Back" }));

      expect(mockGoBack).toHaveBeenCalledTimes(1);
      expect(mockGoToStep).not.toHaveBeenCalled();
    });

    it("navigates to how comfortable pricking finger when there is no history", () => {
      mockNavigationContext.stepHistory = ["go-to-clinic"];

      render(<GoToClinicPage />);

      fireEvent.click(screen.getByRole("button", { name: "Back" }));

      expect(mockGoToStep).toHaveBeenCalledWith("how-comfortable-pricking-finger");
      expect(mockGoBack).not.toHaveBeenCalled();
    });
  });
});
