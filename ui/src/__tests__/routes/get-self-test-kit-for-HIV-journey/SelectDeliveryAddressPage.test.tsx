import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthContext, AuthUser } from "@/state/AuthContext";
import {
  CreateOrderContextType,
  CreateOrderProvider,
  OrderAnswers,
  useCreateOrderContext,
} from "@/state/OrderContext";
import { JourneyNavigationContextType, JourneyNavigationProvider } from "@/state/NavigationContext";
import { PostcodeLookupContextType, PostcodeLookupProvider } from "@/state/PostcodeLookupContext";
import { MemoryRouter } from "react-router-dom";
import SelectDeliveryAddressPage from "@/routes/get-self-test-kit-for-HIV-journey/SelectDeliveryAddressPage";
import { useEffect } from "react";
import laLookupService from "@/lib/services/la-lookup-service";
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

const mockLookupPostcode = jest.fn();
const mockLookupResultsStatus = "idle";
const mockGoToStep = jest.fn();
const mockGoBack = jest.fn();
const mockSetReturnToStep = jest.fn();
const mockUpdateOrderAnswers = jest.fn();
const mockUseAuth = jest.fn(() => ({ user: mockUser }));

const mockOrderAnswers: OrderAnswers = {
  postcodeSearch: "B99 95C",
  selectedAddressId: "",
};

jest.mock("@/state", () => ({
  ...jest.requireActual("@/state"),
  usePostcodeLookup: () =>
    ({
      lookupPostcode: mockLookupPostcode,
      lookupResultsStatus: mockLookupResultsStatus,
      addresses: [
        {
          id: "MOCK0000001",
          fullAddress: "1 TEST ROAD, CHECK TOWN, B99 95C",
          town: "CHECK TOWN",
          postcode: "B99 95C",
          line1: "1 TEST ROAD",
          line2: "",
          line3: "",
        },
        {
          id: "MOCK0000002",
          fullAddress: "2 TEST ROAD, CHECK TOWN, B99 95C",
          town: "CHECK TOWN",
          postcode: "B99 95C",
          line1: "2 TEST ROAD",
          line2: "",
          line3: "",
        },
        {
          id: "MOCK0000003",
          fullAddress: "FLAT 1, TEST BUILDING, 3 TEST ROAD, CHECK TOWN, B99 95C",
          town: "CHECK TOWN",
          postcode: "B99 95C",
          line1: "FLAT 1, TEST BUILDING",
          line2: "3 TEST ROAD",
          line3: "",
        },
      ],
      postcode: "B99 95C",
      selectedAddress: null,
      isLoading: false,
      error: null,
      setSelectedAddress: jest.fn(),
      clearAddresses: jest.fn(),
    }) satisfies PostcodeLookupContextType,
  useJourneyNavigationContext: () =>
    ({
      goToStep: mockGoToStep,
      goBack: mockGoBack,
      stepHistory: [JourneyStepNames.SelectDeliveryAddress],
      returnToStep: null,
      setReturnToStep: mockSetReturnToStep,
      canGoBack: jest.fn(() => false),
      currentStep: JourneyStepNames.SelectDeliveryAddress,
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

jest.mock("@/lib/services/la-lookup-service", () => ({
  __esModule: true,
  default: {
    getByPostcode: jest.fn().mockResolvedValue({
      localAuthority: { localAuthorityCode: "4230", region: "Salford" },
      suppliers: [{ id: "SUP1", name: "Supplier One", testCode: "31676001" }],
    }),
  },
}));

jest.mock("@/hooks/useContent", () => ({
  useContent: () => ({
    commonContent: {
      validation: { deliveryAddress: { required: "Select a delivery address" } },
      errorSummary: { title: "There is a problem" },
      navigation: { continue: "Continue", manualEntryLink: "Enter address manually" },
    },
    "select-delivery-address": {
      title: "addresses found",
      postcodeLabel: "Postcode:",
      editPostcodeLink: "Edit postcode",
      formLabel: "Select your delivery address",
    },
  }),
}));

function StateSeeder({ children }: { children: React.ReactNode }) {
  const { updateOrderAnswers } = useCreateOrderContext();
  useEffect(() => {
    updateOrderAnswers({ postcodeSearch: "B99 95C" });
  }, [updateOrderAnswers]);
  return <>{children}</>;
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/get-self-test-kit-for-HIV/select-delivery-address"]}>
    <AuthContext.Provider value={{ user: mockUser, setUser: jest.fn() }}>
      <JourneyNavigationProvider>
        <CreateOrderProvider>
          <PostcodeLookupProvider>
            <StateSeeder>{children}</StateSeeder>
          </PostcodeLookupProvider>
        </CreateOrderProvider>
      </JourneyNavigationProvider>
    </AuthContext.Provider>
  </MemoryRouter>
);

describe("SelectDeliveryAddressPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockImplementation(() => ({ user: mockUser }));
  });

  it("navigates to kit not available when lookup returns no suppliers", async () => {
    (laLookupService.getByPostcode as jest.Mock).mockResolvedValueOnce({
      localAuthority: { localAuthorityCode: "4230", region: "Salford" },
      suppliers: [],
    });

    render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[0]);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(mockGoToStep).toHaveBeenCalledWith("kit-not-available-in-area");
    });
  });

  it("navigates to under 18 step when user is under 18", async () => {
    mockUseAuth.mockImplementation(() => ({ user: { ...mockUser, birthdate: "2010-01-01" } }));

    render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[0]);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(mockGoToStep).toHaveBeenCalledWith(JourneyStepNames.CannotUseServiceUnder18);
    });
  });
});
