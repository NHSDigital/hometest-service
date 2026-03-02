import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CheckYourAnswersPage from "@/routes/get-self-test-kit-for-HIV-journey/CheckYourAnswersPage";
import {
  CreateOrderProvider,
  JourneyNavigationProvider,
  useCreateOrderContext,
} from "@/state";
import { useEffect } from "react";
import orderService from "@/lib/services/order-service";

const mockGoToStep = jest.fn();
const mockSetReturnToStep = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@/lib/services/order-service");

jest.mock("@/state", () => {
  const actual = jest.requireActual("@/state");
  return {
    ...actual,
    useJourneyNavigationContext: () => ({
      currentStep: "check-your-answers",
      stepHistory: ["enter-mobile-phone-number", "check-your-answers"],
      returnToStep: null,
      goToStep: mockGoToStep,
      goBack: mockGoBack,
      canGoBack: () => true,
      clearHistory: jest.fn(),
      setReturnToStep: mockSetReturnToStep,
    }),
  };
});

// Helper component to pre-populate order state
function StateSeeder({
  children,
  orderData,
}: {
  children: React.ReactNode;
  orderData: Record<string, unknown>;
}) {
  const { updateOrderAnswers } = useCreateOrderContext();

  useEffect(() => {
    updateOrderAnswers(orderData);
  }, [orderData, updateOrderAnswers]);

  return <>{children}</>;
}

const defaultOrderData = {
  user: {
    sub: "test-sub",
    nhsNumber: "1234567890",
    birthdate: "1990-01-01",
    identityProofingLevel: "P9",
    phoneNumber: "07402123123",
    givenName: "John",
    familyName: "Smith",
  },
  deliveryAddress: {
    addressLine1: "73 Roman Rd",
    postTown: "Leeds",
    postcode: "LS2 5ZN",
  },
  comfortableDoingTest: "Yes",
  mobileNumber: "07402123123",
  supplier: [
    {
      id: "test-supplier-id",
      name: "Test Supplier",
      testCode: "HIV-001",
    },
  ],
};

const TestWrapper = ({
  children,
  orderData = defaultOrderData,
}: {
  children: React.ReactNode;
  orderData?: Record<string, unknown>;
}) => (
  <MemoryRouter
    initialEntries={["/get-self-test-kit-for-HIV/check-your-answers"]}
  >
    <JourneyNavigationProvider>
      <CreateOrderProvider>
        <StateSeeder orderData={orderData}>{children}</StateSeeder>
      </CreateOrderProvider>
    </JourneyNavigationProvider>
  </MemoryRouter>
);

describe("CheckYourAnswersPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders the main heading", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      const heading = screen.getByRole("heading", {
        name: /check your answers/i,
      });
      expect(heading).toBeInTheDocument();
    });

    it("renders the update message", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      expect(
        screen.getByText(
          /we'll update you about your hiv test on the account you use for your nhs login/i,
        ),
      ).toBeInTheDocument();
    });

    it("renders the delivery message", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      expect(
        screen.getByText(/the kit will arrive within 5 working days/i),
      ).toBeInTheDocument();
    });

    it("renders the submit order button", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      expect(
        screen.getByRole("button", { name: /submit order/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Summary List Content", () => {
    it("displays the user name", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      expect(screen.getByText("John Smith")).toBeInTheDocument();
    });

    it("displays the delivery address", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      expect(screen.getByText(/73 Roman Rd/)).toBeInTheDocument();
      expect(screen.getByText(/Leeds/)).toBeInTheDocument();
      expect(screen.getByText(/LS2 5ZN/)).toBeInTheDocument();
    });

    it("displays the comfortable doing test answer", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      expect(
        screen.getByText(/yes i'm comfortable, send me the kit/i),
      ).toBeInTheDocument();
    });

    it("displays the mobile number", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      expect(screen.getByText("07402123123")).toBeInTheDocument();
    });

    it("renders summary labels", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(
        screen.getByText("Delivery address", {
          selector: ".nhsuk-summary-list__key",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Are you comfortable doing the HIV self-test?", {
          selector: ".nhsuk-summary-list__key",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("What's your mobile phone number?", {
          selector: ".nhsuk-summary-list__key",
        }),
      ).toBeInTheDocument();
    });
  });

  describe("Change Links", () => {
    it("renders change links for editable fields", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      const changeLinks = screen.getAllByText("Change");
      // Delivery address, comfortable doing test, mobile number (3 change links)
      expect(changeLinks).toHaveLength(3);
    });

    it("does not render a change link for the name", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      const changeLinks = screen.getAllByText("Change");
      // Only 3 change links, not 4 - name has no change link
      expect(changeLinks).toHaveLength(3);
    });

    it("sets returnToStep and navigates to select-delivery-address when delivery address change is clicked (default)", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      const changeLinks = screen.getAllByText("Change");
      fireEvent.click(changeLinks[0]);

      expect(mockSetReturnToStep).toHaveBeenCalledWith("check-your-answers");
      expect(mockGoToStep).toHaveBeenCalledWith("select-delivery-address");
    });

    it("navigates to enter-address-manually when delivery address was entered manually", () => {
      const orderDataWithManualAddress = {
        ...defaultOrderData,
        addressEntryMethod: 'manual' as const,
      };

      render(<CheckYourAnswersPage />, {
        wrapper: ({ children }) => (
          <TestWrapper orderData={orderDataWithManualAddress}>
            {children}
          </TestWrapper>
        )
      });

      const changeLinks = screen.getAllByText("Change");
      fireEvent.click(changeLinks[0]);

      expect(mockSetReturnToStep).toHaveBeenCalledWith("check-your-answers");
      expect(mockGoToStep).toHaveBeenCalledWith("enter-address-manually");
    });

    it("sets returnToStep and navigates when comfortable doing test change is clicked", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      const changeLinks = screen.getAllByText("Change");
      fireEvent.click(changeLinks[1]);

      expect(mockSetReturnToStep).toHaveBeenCalledWith("check-your-answers");
      expect(mockGoToStep).toHaveBeenCalledWith(
        "how-comfortable-pricking-finger",
      );
    });

    it("navigates to confirm-mobile-phone-number when mobile number change is clicked (NHS Login flow)", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      const changeLinks = screen.getAllByText("Change");
      fireEvent.click(changeLinks[2]);

      expect(mockSetReturnToStep).toHaveBeenCalledWith("check-your-answers");
      expect(mockGoToStep).toHaveBeenCalledWith("confirm-mobile-phone-number");
    });

    it("navigates to enter-mobile-number when mobile number was entered manually", () => {
      const orderDataWithManualMobile = {
        ...defaultOrderData,
        mobileNumberSource: 'manual' as const,
      };

      render(<CheckYourAnswersPage />, {
        wrapper: ({ children }) => (
          <TestWrapper orderData={orderDataWithManualMobile}>
            {children}
          </TestWrapper>
        )
      });

      const changeLinks = screen.getAllByText("Change");
      fireEvent.click(changeLinks[2]);

      expect(mockSetReturnToStep).toHaveBeenCalledWith("check-your-answers");
      expect(mockGoToStep).toHaveBeenCalledWith("enter-mobile-phone-number");
    });

    it("renders visually hidden text for accessibility on change links", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      expect(
        screen.getByText("Delivery address", {
          selector: ".nhsuk-u-visually-hidden",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Are you comfortable doing the HIV self-test?",
          { selector: ".nhsuk-u-visually-hidden" },
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("What's your mobile phone number?", {
          selector: ".nhsuk-u-visually-hidden",
        }),
      ).toBeInTheDocument();
    });
  });

  describe("Consent Checkbox", () => {
    it("renders the consent fieldset with legend", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      expect(screen.getByText("Your consent")).toBeInTheDocument();
    });

    it("renders the consent checkbox", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });
  });

  describe("Submit Order", () => {
    it("shows error when submitting without consent", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", {
        name: /submit order/i,
      });
      fireEvent.click(submitButton);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("There is a problem")).toBeInTheDocument();
      expect(
        screen.getAllByText(
          "Select if you agree to our partner's terms and conditions and privacy policy",
        ).length,
      ).toBeGreaterThanOrEqual(1);
    });

    it("error summary links to consent checkbox", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", {
        name: /submit order/i,
      });
      fireEvent.click(submitButton);

      const errorLink = screen.getByRole("link", {
        name: "Select if you agree to our partner's terms and conditions and privacy policy",
      });
      expect(errorLink).toHaveAttribute("href", "#consent");
    });

    it("submits successfully when consent is ticked", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const mockOrderResponse = {
        orderUid: "test-order-uid",
        orderReference: "ORD-12345",
        message: "Order submitted successfully"
      };

      (orderService.submitOrder as jest.Mock).mockResolvedValue(mockOrderResponse);

      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);

      const submitButton = screen.getByRole("button", {
        name: /submit order/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[CheckYourAnswersPage] Consent recorded at:",
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      );

      expect(orderService.submitOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          testCode: "HIV-001",
          testDescription: "HIV antigen test",
          supplierId: "test-supplier-id",
          consent: true,
          patient: expect.objectContaining({
            family: "Smith",
            given: ["John"],
            nhsNumber: "1234567890",
            birthDate: "1990-01-01",
          }),
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "Order router response:",
        mockOrderResponse,
      );

      await waitFor(() => {
        expect(mockGoToStep).toHaveBeenCalledWith("order-confirmation");
      });

      consoleSpy.mockRestore();
    });

    it("does not submit when consent is not ticked", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", {
        name: /submit order/i,
      });
      fireEvent.click(submitButton);

      expect(orderService.submitOrder).not.toHaveBeenCalled();
    });
  });

  describe("Back Link", () => {
    it("calls goBack when back link is clicked", () => {
      render(<CheckYourAnswersPage />, { wrapper: TestWrapper });

      const backLink = screen.getByText("Back");
      fireEvent.click(backLink);

      expect(mockGoBack).toHaveBeenCalled();
    });
  });
});
