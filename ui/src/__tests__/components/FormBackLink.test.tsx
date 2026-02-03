import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { FormBackLink } from "@/components/FormBackLink";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => "/test-step",
}));

// Mock the useJourneyNavigationContext hook
const mockNavigationContext = {
  currentStep: "test-step",
  stepHistory: ["previous-step", "test-step"],
  goToStep: jest.fn(),
  goBack: jest.fn(),
  canGoBack: jest.fn(() => true),
  clearHistory: jest.fn(),
};

jest.mock("@/state", () => ({
  useJourneyNavigationContext: () => mockNavigationContext,
}));

// Mock console.log to avoid noise in test output
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

describe("FormBackLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigationContext.canGoBack.mockReturnValue(true);
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe("Rendering", () => {
    it("renders with default text when can go back", () => {
      render(<FormBackLink />);

      expect(screen.getByText("Back")).toBeInTheDocument();
    });

    it("renders with custom text", () => {
      render(<FormBackLink text="Go Back" />);

      expect(screen.getByText("Go Back")).toBeInTheDocument();
    });

    it("does not render when cannot go back and no custom onClick", () => {
      mockNavigationContext.canGoBack.mockReturnValue(false);

      render(<FormBackLink />);

      expect(screen.queryByText("Back")).not.toBeInTheDocument();
    });

    it("renders when cannot go back but has custom onClick", () => {
      mockNavigationContext.canGoBack.mockReturnValue(false);
      const mockOnClick = jest.fn();

      render(<FormBackLink onClick={mockOnClick} />);

      expect(screen.getByText("Back")).toBeInTheDocument();
    });
  });

  describe("Click Handling", () => {
    it("calls goBack when clicked and no custom onClick provided", () => {
      render(<FormBackLink />);

      const backLink = screen.getByText("Back");
      fireEvent.click(backLink);

      expect(mockNavigationContext.goBack).toHaveBeenCalledTimes(1);
    });

    it("calls custom onClick when provided", () => {
      const mockOnClick = jest.fn();

      render(<FormBackLink onClick={mockOnClick} />);

      const backLink = screen.getByText("Back");
      fireEvent.click(backLink);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockNavigationContext.goBack).not.toHaveBeenCalled();
    });

    it("calls custom onClick even when cannot go back", () => {
      mockNavigationContext.canGoBack.mockReturnValue(false);
      const mockOnClick = jest.fn();

      render(<FormBackLink onClick={mockOnClick} />);

      const backLink = screen.getByText("Back");
      fireEvent.click(backLink);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Props", () => {
    it("uses default text prop value", () => {
      render(<FormBackLink />);

      expect(screen.getByText("Back")).toBeInTheDocument();
    });

    it("accepts custom text prop", () => {
      render(<FormBackLink text="Previous Page" />);

      expect(screen.getByText("Previous Page")).toBeInTheDocument();
      expect(screen.queryByText("Back")).not.toBeInTheDocument();
    });

    it("handles empty text prop", () => {
      render(<FormBackLink text="" />);

      // BackLink should still be rendered but with empty text
      // Check for the back link container class
      expect(document.querySelector('.nhsuk-back-link')).toBeInTheDocument();
    });
  });

  describe("Conditional Rendering Logic", () => {
    it("shows when canGoBack returns true", () => {
      mockNavigationContext.canGoBack.mockReturnValue(true);

      render(<FormBackLink />);

      expect(screen.getByText("Back")).toBeInTheDocument();
    });

    it("hides when canGoBack returns false and no onClick", () => {
      mockNavigationContext.canGoBack.mockReturnValue(false);

      render(<FormBackLink />);

      expect(screen.queryByText("Back")).not.toBeInTheDocument();
    });

    it("shows when canGoBack returns false but onClick is provided", () => {
      mockNavigationContext.canGoBack.mockReturnValue(false);
      const mockOnClick = jest.fn();

      render(<FormBackLink onClick={mockOnClick} />);

      expect(screen.getByText("Back")).toBeInTheDocument();
    });
  });
});
