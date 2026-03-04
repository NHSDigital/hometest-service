import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";

import KitNotAvailableInAreaPage from "@/routes/get-self-test-kit-for-HIV-journey/KitNotAvailableInAreaPage";
import { usePageContent } from "@/hooks";

const mockGoToStep = jest.fn();
const mockGoBack = jest.fn();

const mockNavigationContext = {
  goToStep: mockGoToStep,
  goBack: mockGoBack,
  stepHistory: ["enter-delivery-address", "kit-not-available-in-area"],
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

jest.mock("@/layouts/PageLayout", () => ({
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

describe("KitNotAvailableInAreaPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigationContext.stepHistory = ["enter-delivery-address", "kit-not-available-in-area"];

    (usePageContent as jest.Mock).mockReturnValue({
      title: "Free HIV self-test kits are not available in your area using this service",
      description: "There are other options to get an HIV test.",
      moreOptionsHeading: "More options and information",
    });
  });

  describe("Component Rendering", () => {
    it("renders the title and description", () => {
      render(<KitNotAvailableInAreaPage />);

      expect(
        screen.getByRole("heading", {
          name: "Free HIV self-test kits are not available in your area using this service",
        }),
      ).toBeInTheDocument();

      expect(screen.getByText("There are other options to get an HIV test.")).toBeInTheDocument();
    });
  });

  describe("Back button behavior", () => {
    it("calls goBack when there is history", () => {
      render(<KitNotAvailableInAreaPage />);

      fireEvent.click(screen.getByRole("button", { name: "Back" }));

      expect(mockGoBack).toHaveBeenCalledTimes(1);
      expect(mockGoToStep).not.toHaveBeenCalled();
    });

    it("navigates to enter delivery address when there is no history", () => {
      mockNavigationContext.stepHistory = ["kit-not-available-in-area"];

      render(<KitNotAvailableInAreaPage />);

      fireEvent.click(screen.getByRole("button", { name: "Back" }));

      expect(mockGoToStep).toHaveBeenCalledWith("enter-delivery-address");
      expect(mockGoBack).not.toHaveBeenCalled();
    });
  });
});
