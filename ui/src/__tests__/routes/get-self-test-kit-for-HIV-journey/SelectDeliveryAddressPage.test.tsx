import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { CreateOrderProvider } from "@/state/OrderContext";
import { JourneyNavigationProvider } from "@/state/NavigationContext";
import { MemoryRouter } from "react-router-dom";
import SelectDeliveryAddressPage from "@/routes/get-self-test-kit-for-HIV-journey/SelectDeliveryAddressPage";

jest.mock("@/mocks/addressLookupResponse.json", () => ({
  header: {
    totalresults: 3,
  },
  results: [
    {
      DPA: {
        UPRN: "100091215278",
        ADDRESS: "3 POST OFFICE COTTAGE, HIGH STREET, WETHERSFIELD, BRAINTREE, CM7 4BY",
        BUILDING_NAME: "3 POST OFFICE COTTAGE",
        THOROUGHFARE_NAME: "HIGH STREET",
        DEPENDENT_LOCALITY: "WETHERSFIELD",
        POST_TOWN: "BRAINTREE",
        POSTCODE: "CM7 4BY",
      },
    },
    {
      DPA: {
        UPRN: "100091215283",
        ADDRESS: "BURLEIGH COTTAGE, HIGH STREET, WETHERSFIELD, BRAINTREE, CM7 4BY",
        BUILDING_NAME: "BURLEIGH COTTAGE",
        THOROUGHFARE_NAME: "HIGH STREET",
        DEPENDENT_LOCALITY: "WETHERSFIELD",
        POST_TOWN: "BRAINTREE",
        POSTCODE: "CM7 4BY",
      },
    },
    {
      DPA: {
        UPRN: "100091215306",
        ADDRESS: "CHASE HOUSE, HIGH STREET, WETHERSFIELD, BRAINTREE, CM7 4BY",
        BUILDING_NAME: "CHASE HOUSE",
        THOROUGHFARE_NAME: "HIGH STREET",
        DEPENDENT_LOCALITY: "WETHERSFIELD",
        POST_TOWN: "BRAINTREE",
        POSTCODE: "CM7 4BY",
      },
    },
  ],
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

// Mock useContent to provide predictable content for tests
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
      <CreateOrderProvider>{children}</CreateOrderProvider>
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

      expect(screen.getByText(/3 POST OFFICE COTTAGE, HIGH STREET, WETHERSFIELD, BRAINTREE, CM7 4BY/i)).toBeInTheDocument();
      expect(screen.getByText(/BURLEIGH COTTAGE, HIGH STREET, WETHERSFIELD, BRAINTREE, CM7 4BY/i)).toBeInTheDocument();
      expect(screen.getByText(/CHASE HOUSE, HIGH STREET, WETHERSFIELD, BRAINTREE, CM7 4BY/i)).toBeInTheDocument();
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

      await screen.findByText(/3 POST OFFICE COTTAGE/i);
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
