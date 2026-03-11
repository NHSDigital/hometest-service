import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";

import { AuthProvider, useAuth } from "@/state/AuthContext";
import { CreateOrderProvider } from "@/state/OrderContext";
import HowComfortablePrickingFingerPage from "@/routes/get-self-test-kit-for-HIV-journey/HowComfortablePrickingFingerPage";
import { JourneyNavigationProvider } from "@/state/NavigationContext";
import { MemoryRouter, useLocation } from "react-router-dom";

jest.mock("@/hooks", () => ({
  useContent: () => ({
    commonContent: {
      navigation: {
        back: "Back",
        continue: "Continue",
      },
      validation: {
        comfortableDoingTest: {
          required: "Select yes if you're comfortable doing the test yourself",
        },
      },
      errorSummary: {
        title: "There is a problem",
      },
      links: {
        bloodSampleGuide: {
          text: "Blood sample step-by-step guide",
        },
      },
    },
    "how-comfortable-pricking-finger": {
      title: "This is what you'll need to do to give a blood sample",
      instructions: "To give a sample of blood, you'll need to:",
      steps: {
        prickFinger: "prick your finger",
        fillTube: "fill a tube with blood",
      },
      image: {
        alt: "Person collecting blood sample by pricking finger, with blood droplet falling into collection tube.",
      },
      formLabel: "Are you comfortable doing the HIV self-test?",
      options: {
        yes: {
          text: "Yes I'm comfortable, send me the kit",
          hint: "The test is supplied by [Supplier], a trusted partner of the NHS",
        },
        no: {
          text: "No, I'd rather go to a sexual health clinic instead",
          hint: "They will take a blood sample for you",
        },
      },
    },
  }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter
    initialEntries={["/get-self-test-kit-for-HIV/how-comfortable-pricking-finger"]}
  >
    <AuthProvider>
      <JourneyNavigationProvider>
        <CreateOrderProvider>{children}</CreateOrderProvider>
      </JourneyNavigationProvider>
    </AuthProvider>
  </MemoryRouter>
);

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
};

const SetUserWithPhoneNumber = () => {
  const { setUser } = useAuth();

  useEffect(() => {
    setUser({
      sub: "user-id",
      nhsNumber: "1234567890",
      birthdate: "1990-01-01",
      identityProofingLevel: "P9",
      phoneNumber: "07123456789",
      givenName: "John",
      familyName: "Doe",
      email: "john.doe@example.com",
    });
  }, [setUser]);

  return null;
};

describe("HowComfortablePrickingFingerPage", () => {
  describe("Component Rendering", () => {
    it("renders the main heading", () => {
      render(<HowComfortablePrickingFingerPage />, { wrapper: TestWrapper });

      const heading = screen.getByRole("heading", {
        name: /this is what you'll need to do to give a blood sample/i,
      });
      expect(heading).toBeInTheDocument();
    });

    it("renders the blood sample instructions", () => {
      render(<HowComfortablePrickingFingerPage />, { wrapper: TestWrapper });

      expect(screen.getByText(/to give a sample of blood, you'll need to:/i)).toBeInTheDocument();
      expect(screen.getByText(/prick your finger/i)).toBeInTheDocument();
      expect(screen.getByText(/fill a tube with blood/i)).toBeInTheDocument();
    });

    it("renders the step-by-step guide link", () => {
      render(<HowComfortablePrickingFingerPage />, { wrapper: TestWrapper });

      const guideLink = screen.getByRole("link", { name: /blood sample step-by-step guide/i });
      expect(guideLink).toBeInTheDocument();
      expect(guideLink).toHaveAttribute("href", "blood-sample-guide");
    });

    it("renders all form elements", () => {
      render(<HowComfortablePrickingFingerPage />, { wrapper: TestWrapper });

      expect(screen.getByText(/are you comfortable doing the hiv self-test\?/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
    });

    it("renders both radio options with correct text and hints", () => {
      render(<HowComfortablePrickingFingerPage />, { wrapper: TestWrapper });

      expect(screen.getByText(/yes i'm comfortable, send me the kit/i)).toBeInTheDocument();
      expect(screen.getByText(/the test is supplied by \[supplier\], a trusted partner of the nhs/i)).toBeInTheDocument();
      expect(screen.getByText(/no, i'd rather go to a sexual health clinic instead/i)).toBeInTheDocument();
      expect(screen.getByText(/they will take a blood sample for you/i)).toBeInTheDocument();
    });

    it("renders correct number of radio buttons", () => {
      render(<HowComfortablePrickingFingerPage />, { wrapper: TestWrapper });

      const radios = screen.getAllByRole("radio");
      expect(radios).toHaveLength(2);
    });

    it("renders the image with correct alt text", () => {
      render(<HowComfortablePrickingFingerPage />, { wrapper: TestWrapper });

      const image = screen.getByAltText(/person collecting blood sample by pricking finger/i);
      expect(image).toBeInTheDocument();
    });
  });

  describe("ErrorSummary", () => {
    it("should show error summary when no option is selected", () => {
      render(<HowComfortablePrickingFingerPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("There is a problem")).toBeInTheDocument();
    });

    it("should not show error summary initially", () => {
      render(<HowComfortablePrickingFingerPage />, { wrapper: TestWrapper });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByText("There is a problem")).not.toBeInTheDocument();
    });

    it("should link to radio group in error summary", () => {
      render(<HowComfortablePrickingFingerPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      const errorLink = screen.getByRole("link", { name: "Select yes if you're comfortable doing the test yourself" });
      expect(errorLink).toHaveAttribute("href", "#comfortable");
    });

    it("should clear error when form is resubmitted with a selection", () => {
      render(<HowComfortablePrickingFingerPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByRole("alert")).toBeInTheDocument();

      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[0]);

      fireEvent.click(submitButton);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("Radio Selection Validation", () => {
    it("should show error message when submitting without selection", () => {
      render(<HowComfortablePrickingFingerPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getAllByText("Select yes if you're comfortable doing the test yourself")).toHaveLength(2);
    });

    it("should not show error when an option is selected and form is submitted", () => {
      render(<HowComfortablePrickingFingerPage />, { wrapper: TestWrapper });

      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[0]);

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.queryByText("Select yes if you're comfortable doing the test yourself")).not.toBeInTheDocument();
    });

    it("should allow selecting different options", () => {
      render(<HowComfortablePrickingFingerPage />, { wrapper: TestWrapper });

      const radios = screen.getAllByRole("radio");

      fireEvent.click(radios[0]);
      expect(radios[0]).toBeChecked();
      expect(radios[1]).not.toBeChecked();

      fireEvent.click(radios[1]);
      expect(radios[0]).not.toBeChecked();
      expect(radios[1]).toBeChecked();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for error summary", () => {
      render(<HowComfortablePrickingFingerPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-labelledby", "error-summary-title");
    });

    it("should have unique ids for each radio button", () => {
      render(<HowComfortablePrickingFingerPage />, { wrapper: TestWrapper });

      const radios = screen.getAllByRole("radio");
      const ids = radios.map(radio => radio.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(radios.length);
    });
  });

  describe("Navigation", () => {
    it("navigates to enter mobile number when Yes is selected and user has no phone number", () => {
      render(
        <>
          <HowComfortablePrickingFingerPage />
          <LocationDisplay />
        </>,
        { wrapper: TestWrapper },
      );

      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[0]);

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByTestId("location-display")).toHaveTextContent(
        "/get-self-test-kit-for-HIV/enter-mobile-phone-number",
      );
    });

    it("navigates to confirm mobile number when Yes is selected and user has a phone number", () => {
      render(
        <>
          <SetUserWithPhoneNumber />
          <HowComfortablePrickingFingerPage />
          <LocationDisplay />
        </>,
        { wrapper: TestWrapper },
      );

      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[0]);

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByTestId("location-display")).toHaveTextContent(
        "/get-self-test-kit-for-HIV/confirm-mobile-phone-number",
      );
    });

    it("navigates to go to clinic when No is selected", () => {
      render(
        <>
          <HowComfortablePrickingFingerPage />
          <LocationDisplay />
        </>,
        { wrapper: TestWrapper },
      );

      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[1]);

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByTestId("location-display")).toHaveTextContent(
        "/get-self-test-kit-for-HIV/go-to-clinic",
      );
    });
  });
});
