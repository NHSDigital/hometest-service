import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CreateOrderProvider } from "@/state/OrderContext";
import EnterDeliveryAddressPage from "@/routes/get-self-test-kit-for-HIV-journey/EnterDeliveryAddressPage";
import { JourneyNavigationProvider } from "@/state/NavigationContext";
import { MemoryRouter } from "react-router-dom";
import { PostcodeLookupProvider } from "@/state/PostcodeLookupContext";

const mockLookupPostcode = jest.fn();
const mockClearAddresses = jest.fn();
let mockLookupResultsStatus = "idle";
let mockIsLoading = false;

jest.mock("@/state", () => ({
  ...jest.requireActual("@/state"),
  usePostcodeLookup: () => ({
    lookupPostcode: mockLookupPostcode,
    lookupResultsStatus: mockLookupResultsStatus,
    isLoading: mockIsLoading,
    addresses: [],
    clearAddresses: mockClearAddresses,
  }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/get-self-test-kit-for-HIV/enter-delivery-address"]}>
    <JourneyNavigationProvider>
      <CreateOrderProvider>
        <PostcodeLookupProvider>{children}</PostcodeLookupProvider>
      </CreateOrderProvider>
    </JourneyNavigationProvider>
  </MemoryRouter>
);

describe("EnterDeliveryAddressPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLookupResultsStatus = "idle";
    mockIsLoading = false;
  });

  describe("Component Rendering", () => {
    it("renders the main heading", () => {
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const heading = screen.getByRole("heading", {
        name: /enter your delivery address and we'll check if the kit's available/i,
      });
      expect(heading).toBeInTheDocument();
    });

    it("renders all form elements", () => {
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      expect(screen.getByLabelText(/postcode/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/building number or name/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
      expect(screen.getByText(/enter address manually/i)).toBeInTheDocument();
    });
  });

  describe("ErrorSummary", () => {
    it("should show error summary when there are validation errors", () => {
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      const errorSummaryHeading = screen.getByRole("heading", { name: "There is a problem" });
      const errorSummary = errorSummaryHeading.closest(
        '[role="alert"][aria-labelledby="error-summary-title"]',
      );
      expect(errorSummary).toBeInTheDocument();
    });

    it("should not show error summary when there are no errors", () => {
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      expect(screen.queryAllByRole("alert")).toHaveLength(0);
      expect(screen.queryByText("There is a problem")).not.toBeInTheDocument();
    });

    it("should link to postcode field in error summary", () => {
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      const errorLink = screen.getByRole("link", {
        name: "Enter a full UK postcode",
      });
      expect(errorLink).toHaveAttribute("href", "#postcode");
    });

    it("should link to building name field in error summary when building name is too long", () => {
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const buildingInput = screen.getByLabelText(/building number or name/i);
      const longName = "A".repeat(101);
      fireEvent.change(buildingInput, { target: { value: longName } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      const errorLink = screen.getByRole("link", {
        name: "Building number or name must be 100 characters or less",
      });
      expect(errorLink).toHaveAttribute("href", "#building-number-or-name");
    });
  });

  describe("Postcode Validation", () => {
    it("should return error for empty postcode", () => {
      mockLookupPostcode.mockResolvedValue(undefined);
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      const postcodeInput = screen.getByLabelText(/postcode/i);
      expect(postcodeInput).toHaveAttribute(
        "aria-describedby",
        expect.stringContaining("error-message"),
      );

      expect(screen.getAllByText("Enter a full UK postcode")).toHaveLength(2);
    });

    it("should return error for postcode too long", () => {
      mockLookupPostcode.mockResolvedValue(undefined);
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const postcodeInput = screen.getByLabelText(/postcode/i);
      fireEvent.change(postcodeInput, { target: { value: "M1 1AA123" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getAllByText("Postcode must be 8 characters or less")).toHaveLength(2);
    });

    it("should return error for invalid postcode format", () => {
      mockLookupPostcode.mockResolvedValue(undefined);
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const postcodeInput = screen.getByLabelText(/postcode/i);
      fireEvent.change(postcodeInput, { target: { value: "INVALID" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getAllByText("Enter a postcode using letters and numbers")).toHaveLength(2);
    });

    it("should accept valid UK postcodes", async () => {
      mockLookupPostcode.mockResolvedValue("valid");
      mockLookupResultsStatus = "found";

      const validPostcodes = ["M1 1AA", "B33 8TH", "W1A 0AX", "EC1A 1BB"];

      for (const postcode of validPostcodes) {
        const { unmount } = render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

        const postcodeInput = screen.getByLabelText(/postcode/i);
        fireEvent.change(postcodeInput, { target: { value: postcode } });

        const submitButton = screen.getByRole("button", { name: /continue/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.queryByText("Enter a full UK postcode")).not.toBeInTheDocument();
          expect(
            screen.queryByText("Postcode must be 8 characters or less"),
          ).not.toBeInTheDocument();
          expect(
            screen.queryByText("Enter a postcode using letters and numbers"),
          ).not.toBeInTheDocument();
        });

        unmount();
        jest.clearAllMocks();
      }
    });
  });

  describe("Building Name Validation", () => {
    it("should accept empty building name (optional field)", () => {
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const postcodeInput = screen.getByLabelText(/postcode/i);
      fireEvent.change(postcodeInput, { target: { value: "M1 1AA" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.queryByText(/building number or name must be/i)).not.toBeInTheDocument();
    });

    it("should return error for building name too long", () => {
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const buildingInput = screen.getByLabelText(/building number or name/i);
      const longName = "A".repeat(101);
      fireEvent.change(buildingInput, { target: { value: longName } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(
        screen.getAllByText("Building number or name must be 100 characters or less"),
      ).toHaveLength(2);
    });

    it("should accept valid building names and numbers", () => {
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const postcodeInput = screen.getByLabelText(/postcode/i);
      fireEvent.change(postcodeInput, { target: { value: "M1 1AA" } });

      const buildingInput = screen.getByLabelText(/building number or name/i);
      const validNames = ["15", "Prospect Cottage", "Flat 2B", "123-125", "O'Connor House"];

      validNames.forEach((name) => {
        fireEvent.change(buildingInput, { target: { value: name } });

        const submitButton = screen.getByRole("button", { name: /continue/i });
        fireEvent.click(submitButton);

        expect(
          screen.queryByText("Building number or name must be 100 characters or less"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should not submit form when validation fails", () => {
      mockLookupPostcode.mockResolvedValue(undefined);
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      const errorSummaryHeading = screen.getByRole("heading", { name: "There is a problem" });
      const errorSummary = errorSummaryHeading.closest(
        '[role="alert"][aria-labelledby="error-summary-title"]',
      );
      expect(errorSummary).toBeInTheDocument();

      expect(screen.getAllByText("Enter a full UK postcode")).toHaveLength(2);
    });

    it("should update form state when valid data is entered", () => {
      mockLookupPostcode.mockResolvedValue(undefined);
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const postcodeInput = screen.getByLabelText(/postcode/i);
      const buildingInput = screen.getByLabelText(/building number or name/i);

      fireEvent.change(postcodeInput, { target: { value: "M1 1AA" } });
      fireEvent.change(buildingInput, { target: { value: "15" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.queryByText("Enter a full UK postcode")).not.toBeInTheDocument();
    });
  });
});
