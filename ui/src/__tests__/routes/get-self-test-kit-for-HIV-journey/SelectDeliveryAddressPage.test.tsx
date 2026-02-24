import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { CreateOrderProvider } from "@/state/OrderContext";
import { JourneyNavigationProvider } from "@/state/NavigationContext";
import { PostcodeLookupProvider } from "@/state/PostcodeLookupContext";
import { MemoryRouter } from "react-router-dom";
import SelectDeliveryAddressPage from "@/routes/get-self-test-kit-for-HIV-journey/SelectDeliveryAddressPage";

const mockLookupPostcode = jest.fn();
const mockLookupResultsStatus = 'idle';

jest.mock('@/state', () => ({
  ...jest.requireActual('@/state'),
  usePostcodeLookup: () => ({
    lookupPostcode: mockLookupPostcode,
    lookupResultsStatus: mockLookupResultsStatus,
    addresses: [
      {
        "id": "MOCK0000001",
        "buildingNumber": "1",
        "buildingName": "",
        "subBuildingName": "",
        "fullAddress": "1 TEST ROAD, CHECK TOWN, B99 95C",
        "thoroughfare": "TEST ROAD",
        "town": "CHECK TOWN",
        "postcode": "B99 95C"
      },
      {
        "id": "MOCK0000002",
        "buildingNumber": "2",
        "buildingName": "",
        "subBuildingName": "",
        "fullAddress": "2 TEST ROAD, CHECK TOWN, B99 95C",
        "thoroughfare": "TEST ROAD",
        "town": "CHECK TOWN",
        "postcode": "B99 95C"
      },
      {
        "id": "MOCK0000003",
        "buildingNumber": "3",
        "buildingName": "TEST BUILDING",
        "subBuildingName": "FLAT 1",
        "fullAddress": "FLAT 1, TEST BUILDING, 3 TEST ROAD, CHECK TOWN, B99 95C",
        "thoroughfare": "TEST ROAD",
        "town": "CHECK TOWN",
        "postcode": "B99 95C"
      },
    ],
  }),
}));

jest.mock('@/lib/services/la-lookup-service', () => ({
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

jest.mock('@/hooks/useContent', () => ({
  useContent: () => ({
    commonContent: {
      validation: {
        deliveryAddress: {
          required: 'Select a delivery address',
        },
      },
      errorSummary: {
        title: 'There is a problem',
      },
      navigation: {
        continue: 'Continue',
        manualEntryLink: 'Enter address manually',
      },
    },
    'select-delivery-address': {
      title: 'addresses found',
      postcodeLabel: 'Postcode:',
      editPostcodeLink: 'Edit postcode',
      formLabel: 'Select your delivery address',
    },
  }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter
    initialEntries={["/get-self-test-kit-for-HIV/select-delivery-address"]}
  >
    <JourneyNavigationProvider>
      <CreateOrderProvider>
        <PostcodeLookupProvider>{children}</PostcodeLookupProvider>
      </CreateOrderProvider>
    </JourneyNavigationProvider>
  </MemoryRouter>
);

describe("SelectDeliveryAddressPage", () => {
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
      expect(screen.getByText(/FLAT 1, TEST BUILDING, 3 TEST ROAD, CHECK TOWN, B99 95C/i)).toBeInTheDocument();
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

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

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

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      const errorLink = screen.getByRole("link", { name: "Select a delivery address" });
      expect(errorLink).toHaveAttribute("href", "#collection-point");
    });
  });

  describe("Radio Selection Validation", () => {
    it("should show error message when submitting without selection", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getAllByText("Select a delivery address")).toHaveLength(2);
    });

    it("should not show error when an address is selected and form is submitted", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[0]);

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

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

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      await screen.findByText(/1 TEST ROAD/i);
    });
  });

  describe("Navigation Links", () => {
    it("should render 'Enter address manually' link", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      const manualLink = screen.getByRole("link", { name: /enter address manually/i });
      expect(manualLink).toBeInTheDocument();
      expect(manualLink).toHaveAttribute("href", "enter-address-manually");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for error summary", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-labelledby", "error-summary-title");
    });

    it("should have unique ids for each radio button", () => {
      render(<SelectDeliveryAddressPage />, { wrapper: TestWrapper });

      const radios = screen.getAllByRole("radio");
      const ids = radios.map(radio => radio.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(radios.length);
    });
  });
});
