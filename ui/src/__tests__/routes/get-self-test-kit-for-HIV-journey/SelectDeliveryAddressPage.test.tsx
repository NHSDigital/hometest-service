import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CreateOrderProvider } from "@/state/OrderContext";
import { JourneyNavigationProvider } from "@/state/NavigationContext";
import { MemoryRouter } from "react-router-dom";
import { PostcodeLookupProvider } from "@/state/PostcodeLookupContext";
import SelectDeliveryAddressPage from "@/routes/get-self-test-kit-for-HIV-journey/SelectDeliveryAddressPage";
import laLookupService from "@/lib/services/la-lookup-service";
import { AuthContext, AuthUser, useCreateOrderContext } from "@/state";
import { useEffect } from "react";
import { JourneyStepNames } from "@/lib/models/route-paths";

const FIXED_TODAY = new Date(2026, 2, 4); // March 4, 2026

const mockLookupPostcode = jest.fn();
const mockLookupResultsStatus = "idle";
const mockGoToStep = jest.fn();

const mockNavigationContext: {
  currentStep: string;
  goToStep: jest.Mock;
  goBack: jest.Mock;
  canGoBack: jest.Mock;
  clearHistory: jest.Mock;
  stepHistory: string[];
  returnToStep: string | null;
  setReturnToStep: jest.Mock;
} = {
  currentStep: "select-delivery-address",
  goToStep: mockGoToStep,
  goBack: jest.fn(),
  canGoBack: jest.fn(() => true),
  clearHistory: jest.fn(),
  stepHistory: ["enter-delivery-address", "select-delivery-address"],
  returnToStep: null,
  setReturnToStep: jest.fn(),
};

const mockUseAuth = jest.fn(() => ({ user: mockUser }));

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

jest.mock("@/state", () => ({
  ...jest.requireActual("@/state"),
  useJourneyNavigationContext: () => mockNavigationContext,
  usePostcodeLookup: () => ({
    lookupPostcode: mockLookupPostcode,
    lookupResultsStatus: mockLookupResultsStatus,
    addresses: [
      {
        id: "MOCK0000001",
        buildingNumber: "1",
        buildingName: "",
        subBuildingName: "",
        fullAddress: "1 TEST ROAD, CHECK TOWN, B99 95C",
        thoroughfare: "TEST ROAD",
        town: "CHECK TOWN",
        postcode: "B99 95C",
      },
      {
        id: "MOCK0000002",
        buildingNumber: "2",
        buildingName: "",
        subBuildingName: "",
        fullAddress: "2 TEST ROAD, CHECK TOWN, B99 95C",
        thoroughfare: "TEST ROAD",
        town: "CHECK TOWN",
        postcode: "B99 95C",
      },
      {
        id: "MOCK0000003",
        buildingNumber: "3",
        buildingName: "TEST BUILDING",
        subBuildingName: "FLAT 1",
        fullAddress: "FLAT 1, TEST BUILDING, 3 TEST ROAD, CHECK TOWN, B99 95C",
        thoroughfare: "TEST ROAD",
        town: "CHECK TOWN",
        postcode: "B99 95C",
      },
    ],
  }),
}));

jest.mock("@/lib/services/la-lookup-service", () => ({
  __esModule: true,
  default: {
    getByPostcode: jest.fn().mockResolvedValue({
      localAuthority: {
        localAuthorityCode: "4230",
        region: "Salford",
      },
      suppliers: [
        { id: "SUP1", name: "Supplier One", testCode: "31676001" },
        { id: "SUP2", name: "Supplier Two", testCode: "PCR" },
      ],
    }),
  },
}));

jest.mock("@/hooks/useContent", () => ({
  useContent: () => ({
    commonContent: {
      validation: {
        deliveryAddress: {
          required: "Select a delivery address",
        },
      },
      errorSummary: {
        title: "There is a problem",
      },
      navigation: {
        continue: "Continue",
        manualEntryLink: "Enter address manually",
      },
    },
    "select-delivery-address": {
      title: "addresses found",
      postcodeLabel: "Postcode:",
      editPostcodeLink: "Edit postcode",
      formLabel: "Select your delivery address",
    },
  }),
}));

function StateSeeder({ children }: Readonly<{ children: React.ReactNode }>) {
  const { updateOrderAnswers } = useCreateOrderContext();

  useEffect(() => {
    updateOrderAnswers({ postcodeSearch: "B99 95C" });
  }, [updateOrderAnswers]);
  return <>{children}</>;
}

const TestWrapper = ({ children, user }: { children: React.ReactNode; user?: AuthUser }) => (
  <MemoryRouter initialEntries={["/get-self-test-kit-for-HIV/select-delivery-address"]}>
    <AuthContext.Provider value={{ user: user || mockUser, setUser: jest.fn() }}>
      <JourneyNavigationProvider>
        <CreateOrderProvider>
          <StateSeeder>
            <PostcodeLookupProvider>{children}</PostcodeLookupProvider>
          </StateSeeder>
        </CreateOrderProvider>
      </JourneyNavigationProvider>
    </AuthContext.Provider>
  </MemoryRouter>
);

describe("SelectDeliveryAddressPage", () => {
  const submitForm = () => {
    const form = screen.getByRole("button", { name: /continue/i }).closest("form");

    if (!form) {
      throw new Error("Delivery address form not found");
    }

    fireEvent.submit(form);
  };

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(FIXED_TODAY);
  });

  beforeEach(() => {
    mockGoToStep.mockClear();
    mockNavigationContext.goBack.mockClear();
    mockNavigationContext.setReturnToStep.mockClear();
    mockNavigationContext.stepHistory = ["enter-delivery-address", "select-delivery-address"];
    mockNavigationContext.returnToStep = null;
    (laLookupService.getByPostcode as jest.Mock).mockClear();
    mockUseAuth.mockImplementation(() => ({ user: mockUser }));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe("Component Rendering", () => {
    it("renders the main heading with correct address count", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      const heading = screen.getByRole("heading");
      expect(heading).toHaveTextContent("3 addresses addresses found");
    });

    it("displays the searched postcode", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      expect(screen.getByText(/postcode:/i)).toBeInTheDocument();
    });

    it("renders edit postcode link", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      const editLink = screen.getByRole("link", { name: /edit postcode/i });
      expect(editLink).toBeInTheDocument();
      expect(editLink).toHaveAttribute("href", "enter-delivery-address");
    });

    it("renders all form elements", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      expect(screen.getByText(/select your delivery address/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
      expect(screen.getByText(/enter address manually/i)).toBeInTheDocument();
    });

    it("renders all address options from mock data", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      expect(screen.getByText(/1 TEST ROAD, CHECK TOWN, B99 95C/i)).toBeInTheDocument();
      expect(screen.getByText(/2 TEST ROAD, CHECK TOWN, B99 95C/i)).toBeInTheDocument();
      expect(
        screen.getByText(/FLAT 1, TEST BUILDING, 3 TEST ROAD, CHECK TOWN, B99 95C/i),
      ).toBeInTheDocument();
    });

    it("renders correct number of radio buttons", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      const radios = screen.getAllByRole("radio");
      expect(radios).toHaveLength(3);
    });
  });

  describe("ErrorSummary", () => {
    it("should show error summary when no address is selected", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      submitForm();

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("There is a problem")).toBeInTheDocument();
    });

    it("should not show error summary initially", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByText("There is a problem")).not.toBeInTheDocument();
    });

    it("should link to radio group in error summary", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      submitForm();

      const errorLink = screen.getByRole("link", { name: "Select a delivery address" });
      expect(errorLink).toHaveAttribute("href", "#collection-point");
    });

    it("should focus first address radio when error summary link is clicked", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      const radios = screen.getAllByRole("radio");
      const errorLink = screen.getByRole("link", { name: "Select a delivery address" });
      fireEvent.click(errorLink);

      expect(radios[0]).toHaveFocus();
    });
  });

  describe("Radio Selection Validation", () => {
    it("should show error message when submitting without selection", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      submitForm();

      expect(screen.getAllByText("Select a delivery address")).toHaveLength(2);
    });

    it("should not show error when an address is selected and form is submitted", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[0]);

      submitForm();

      expect(screen.queryByText("Select a delivery address")).not.toBeInTheDocument();
    });

    it("should allow selecting different addresses", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      const radios = screen.getAllByRole("radio");

      fireEvent.click(radios[0]);
      expect(radios[0]).toBeChecked();
      expect(radios[1]).not.toBeChecked();
      expect(radios[2]).not.toBeChecked();

      fireEvent.click(radios[1]);
      expect(radios[0]).not.toBeChecked();
      expect(radios[1]).toBeChecked();
      expect(radios[2]).not.toBeChecked();
    });

    it("updates order answers and navigates on valid submission", async () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });
      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[0]);

      submitForm();

      await screen.findByText(/1 TEST ROAD/i);
    });

    it("navigates to returnToStep and clears it when return step is set", async () => {
      mockNavigationContext.returnToStep = "check-your-answers";

      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });
      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[0]);

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigationContext.setReturnToStep).toHaveBeenCalledWith(null);
        expect(mockGoToStep).toHaveBeenCalledWith("check-your-answers");
      });
    });

    it("navigates to kit not available when lookup returns no suppliers", async () => {
      (laLookupService.getByPostcode as jest.Mock).mockResolvedValueOnce({
        localAuthority: {
          localAuthorityCode: "4230",
          region: "Salford",
        },
        suppliers: [],
      });

      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[0]);

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockGoToStep).toHaveBeenCalledWith("kit-not-available-in-area");
      });
    });
  });

  describe("Navigation Links", () => {
    it("should render 'Enter address manually' link", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      const manualLink = screen.getByRole("link", { name: /enter address manually/i });
      expect(manualLink).toBeInTheDocument();
      expect(manualLink).toHaveAttribute("href", "enter-address-manually");
    });

    it("navigates to enter delivery address when edit postcode link is clicked", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      const editLink = screen.getByRole("link", { name: /edit postcode/i });
      fireEvent.click(editLink);

      expect(mockGoToStep).toHaveBeenCalledWith("enter-delivery-address");
    });

    it("navigates to manual address entry when manual link is clicked", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      const manualLink = screen.getByRole("link", { name: /enter address manually/i });
      fireEvent.click(manualLink);

      expect(mockGoToStep).toHaveBeenCalledWith("enter-address-manually");
    });

    it("uses goBack when back link is clicked and history has previous steps", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      const backLink = screen.getByText(/^back$/i);
      fireEvent.click(backLink);

      expect(mockNavigationContext.goBack).toHaveBeenCalled();
    });

    it("navigates to enter delivery address when back link is clicked with no history", () => {
      mockNavigationContext.stepHistory = ["select-delivery-address"];

      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      const backLink = screen.getByText(/^back$/i);
      fireEvent.click(backLink);

      expect(mockGoToStep).toHaveBeenCalledWith("enter-delivery-address");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for error summary", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      submitForm();

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-labelledby", "error-summary-title");
    });

    it("should have unique ids for each radio button", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      const radios = screen.getAllByRole("radio");
      const ids = radios.map((radio) => radio.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(radios.length);
    });
  });

  it("navigates to under 18 step when user is under 18", async () => {
    const under18User: AuthUser = {
      ...mockUser,
      birthdate: "2010-01-01", // User is under 18 as of FIXED_TODAY
    };

    render(<SelectDeliveryAddressPage />, {
      wrapper: ({ children }) => <TestWrapper user={under18User}>{children}</TestWrapper>,
    });

    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[0]);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(mockGoToStep).toHaveBeenCalledWith(JourneyStepNames.CannotUseServiceUnder18);
    });
  });
});
