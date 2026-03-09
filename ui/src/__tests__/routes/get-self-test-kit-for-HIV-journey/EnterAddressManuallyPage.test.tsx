import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  CreateOrderContextType,
  CreateOrderProvider,
  OrderAnswers,
  useCreateOrderContext,
} from "@/state/OrderContext";
import EnterAddressManuallyPage from "@/routes/get-self-test-kit-for-HIV-journey/EnterAddressManuallyPage";
import {
  JourneyNavigationContextType,
  JourneyNavigationProvider,
  useJourneyNavigationContext,
} from "@/state/NavigationContext";
import { MemoryRouter } from "react-router-dom";
import laLookupService from "@/lib/services/la-lookup-service";
import { AuthContext, AuthUser } from "@/state/AuthContext";
import { JourneyStepNames } from "@/lib/models/route-paths";

const mockUser: AuthUser = {
  sub: "",
  nhsNumber: "",
  birthdate: "1990-01-01",
  identityProofingLevel: "",
  phoneNumber: "",
  givenName: "",
  familyName: "",
  email: "",
};

jest.mock("@/lib/services/la-lookup-service", () => ({
  __esModule: true,
  default: {
    getByPostcode: jest.fn().mockResolvedValue({
      localAuthority: {
        localAuthorityCode: "4230",
        region: "Salford",
      },
      suppliers: [{ id: "SUP1", name: "Supplier One", testCode: "31676001" }],
    }),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/get-self-test-kit-for-HIV/enter-address-manually"]}>
    <AuthContext.Provider
      value={{
        user: mockUser,
        setUser: jest.fn(),
      }}
    >
      <JourneyNavigationProvider>
        <CreateOrderProvider>{children}</CreateOrderProvider>
      </JourneyNavigationProvider>
    </AuthContext.Provider>
  </MemoryRouter>
);

const mockGoToStep = jest.fn();
const mockGoBack = jest.fn();
const mockSetReturnToStep = jest.fn();
const mockUpdateOrderAnswers = jest.fn();
const mockUseAuth = jest.fn(() => ({
  user: mockUser,
}));

const mockOrderAnswers: OrderAnswers = {
  postcodeSearch: "B99 95C",
  selectedAddressId: "",
};

jest.mock("@/state", () => ({
  ...jest.requireActual("@/state"),
  useJourneyNavigationContext: () =>
    ({
      goToStep: mockGoToStep,
      goBack: mockGoBack,
      stepHistory: [JourneyStepNames.EnterAddressManually],
      returnToStep: null,
      setReturnToStep: mockSetReturnToStep,
      canGoBack: jest.fn(() => false),
      currentStep: JourneyStepNames.EnterAddressManually,
      clearHistory: jest.fn(),
    }) satisfies JourneyNavigationContextType,
  useCreateOrderContext: () =>
    ({
      orderAnswers: mockOrderAnswers,
      updateOrderAnswers: mockUpdateOrderAnswers,
      reset: jest.fn(),
    }) satisfies CreateOrderContextType,
  useAuth: () => mockUseAuth(),
}));

describe("EnterAddressManuallyPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockImplementation(() => ({
      user: mockUser,
    }));
  });

  const ContextObserver = () => {
    const { orderAnswers } = useCreateOrderContext();
    const { currentStep } = useJourneyNavigationContext();

    return (
      <>
        <div data-testid="postcode-search">{orderAnswers.postcodeSearch ?? ""}</div>
        <div data-testid="current-step">{currentStep}</div>
      </>
    );
  };

  describe("Component Rendering", () => {
    it("renders the main heading", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const heading = screen.getByRole("heading", {
        name: /enter your delivery address manually and we'll check if the kit's available/i,
      });
      expect(heading).toBeInTheDocument();
    });

    it("renders all form elements", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/address line 2/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/address line 3/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/town or city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/postcode/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
    });
  });

  describe("ErrorSummary", () => {
    it("should show error summary when there are validation errors", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("There is a problem")).toBeInTheDocument();
    });

    it("should not show error summary when there are no errors", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByText("There is a problem")).not.toBeInTheDocument();
    });

    it("should link to address line 1 field in error summary", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      const errorLink = screen.getByRole("link", {
        name: "Enter address line 1, typically the building and street",
      });
      expect(errorLink).toHaveAttribute("href", "#address-line-1");
    });

    it("should link to town field in error summary and focus it when clicked", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      const townInput = screen.getByLabelText(/town or city/i);
      const errorLink = screen.getByRole("link", {
        name: "Enter a city or town",
      });
      expect(errorLink).toHaveAttribute("href", "#address-town");

      fireEvent.click(errorLink);
      expect(townInput).toHaveFocus();
    });

    it("should link to postcode field in error summary and focus it when clicked", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      const postcodeInput = screen.getByLabelText(/postcode/i);
      const errorLink = screen.getByRole("link", {
        name: "Enter a full UK postcode",
      });
      expect(errorLink).toHaveAttribute("href", "#postcode");

      fireEvent.click(errorLink);
      expect(postcodeInput).toHaveFocus();
    });
  });

  describe("Form Submission", () => {
    it("should not submit form when validation fails", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("There is a problem")).toBeInTheDocument();
    });
  });

  describe("Under 18 Navigation", () => {
    it("should navigate to under 18 step when user is under 18", async () => {
      mockUseAuth.mockImplementation(() => ({
        user: {
          ...mockUser,
          birthdate: "2010-01-01",
        },
      }));

      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const addressLine1Input = screen.getByLabelText(/address line 1/i);
      const townInput = screen.getByLabelText(/town or city/i);
      const postcodeInput = screen.getByLabelText(/postcode/i);

      fireEvent.change(addressLine1Input, { target: { value: "123 Main Street" } });
      fireEvent.change(townInput, { target: { value: "London" } });
      fireEvent.change(postcodeInput, { target: { value: "SW1A 1AA" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockGoToStep).toHaveBeenCalledWith(JourneyStepNames.CannotUseServiceUnder18);
      });
    });
  });

  describe("Eligibility Check", () => {
    const mockedGetByPostcode = laLookupService.getByPostcode as jest.MockedFunction<
      typeof laLookupService.getByPostcode
    >;

    const fillValidRequiredFields = () => {
      fireEvent.change(screen.getByLabelText(/address line 1/i), {
        target: { value: "123 Main Street" },
      });
      fireEvent.change(screen.getByLabelText(/town or city/i), {
        target: { value: "London" },
      });
      fireEvent.change(screen.getByLabelText(/postcode/i), {
        target: { value: "SW1A 1AA" },
      });
    };

    beforeEach(() => {
      mockedGetByPostcode.mockClear();
    });

    it.each([
      ["LA lookup returns null", null],
      [
        "LA lookup returns empty suppliers list",
        {
          localAuthority: {
            localAuthorityCode: "4230",
            region: "Salford",
          },
          suppliers: [],
        },
      ],
    ])(
      "should navigate to KitNotAvailableInArea and save postcodeSearch when %s",
      async (_caseName, laResponse) => {
        mockedGetByPostcode.mockResolvedValueOnce(laResponse as never);

        render(
          <>
            <EnterAddressManuallyPage />
            <ContextObserver />
          </>,
          { wrapper: TestWrapper },
        );

        fillValidRequiredFields();
        fireEvent.click(screen.getByRole("button", { name: /continue/i }));

        await waitFor(() => {
          expect(screen.getByTestId("postcode-search")).toHaveTextContent("SW1A 1AA");
          expect(screen.getByTestId("current-step")).toHaveTextContent("kit-not-available-in-area");
        });

        expect(mockedGetByPostcode).toHaveBeenCalledWith("SW1A 1AA");
      },
    );
  });
});
