import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import EnterAddressManuallyPage from "@/app/enter-address-manually/page";
import { OrderProvider } from "@/state/OrderContext";
import { NavigationProvider } from "@/state/NavigationContext";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => "/enter-address-manually",
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationProvider>
    <OrderProvider>{children}</OrderProvider>
  </NavigationProvider>
);

describe("EnterAddressManuallyPage", () => {
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

  describe("Address Line 1 Validation", () => {
    it("should return error for empty address line 1", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("Enter address line 1, typically the building and street")).toBeInTheDocument();
    });

    it("should return error for invalid special characters in address line 1", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const addressLine1Input = screen.getByLabelText(/address line 1/i);
      fireEvent.change(addressLine1Input, { target: { value: "123 Main St@" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("Enter address line 1, typically the building and street")).toBeInTheDocument();
    });

    it("should accept valid characters in address line 1", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const addressLine1Input = screen.getByLabelText(/address line 1/i);
      const townInput = screen.getByLabelText(/town or city/i);
      const postcodeInput = screen.getByLabelText(/postcode/i);

      fireEvent.change(addressLine1Input, { target: { value: "123-A Main St, Flat 4B (O'Connor & Sons)" } });
      fireEvent.change(townInput, { target: { value: "London" } });
      fireEvent.change(postcodeInput, { target: { value: "SW1A 1AA" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.queryByText("Enter address line 1, typically the building and street")).not.toBeInTheDocument();
    });

    it("should return error for address line 1 over 100 characters", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const addressLine1Input = screen.getByLabelText(/address line 1/i);
      const longAddress = "A".repeat(101);
      fireEvent.change(addressLine1Input, { target: { value: longAddress } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("Address line 1 must be 100 characters or less")).toBeInTheDocument();
    });
  });

  describe("Address Line 2 Validation", () => {
    it("should accept empty address line 2 (optional field)", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const addressLine1Input = screen.getByLabelText(/address line 1/i);
      const townInput = screen.getByLabelText(/town or city/i);
      const postcodeInput = screen.getByLabelText(/postcode/i);

      fireEvent.change(addressLine1Input, { target: { value: "123 Main Street" } });
      fireEvent.change(townInput, { target: { value: "London" } });
      fireEvent.change(postcodeInput, { target: { value: "SW1A 1AA" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.queryByText(/address line 2 must be/i)).not.toBeInTheDocument();
    });

    it("should return error for invalid special characters in address line 2", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const addressLine2Input = screen.getByLabelText(/address line 2/i);
      fireEvent.change(addressLine2Input, { target: { value: "Apartment@123" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("Enter address line 2, typically the building and street")).toBeInTheDocument();
    });

    it("should accept valid characters in address line 2", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const addressLine1Input = screen.getByLabelText(/address line 1/i);
      const addressLine2Input = screen.getByLabelText(/address line 2/i);
      const townInput = screen.getByLabelText(/town or city/i);
      const postcodeInput = screen.getByLabelText(/postcode/i);

      fireEvent.change(addressLine1Input, { target: { value: "123 Main Street" } });
      fireEvent.change(addressLine2Input, { target: { value: "Building A, Floor 2 & 3" } });
      fireEvent.change(townInput, { target: { value: "London" } });
      fireEvent.change(postcodeInput, { target: { value: "SW1A 1AA" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.queryByText("Enter address line 2, typically the building and street")).not.toBeInTheDocument();
    });

    it("should return error for address line 2 over 100 characters", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const addressLine2Input = screen.getByLabelText(/address line 2/i);
      const longAddress = "B".repeat(101);
      fireEvent.change(addressLine2Input, { target: { value: longAddress } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("Address line 2 must be 100 characters or less")).toBeInTheDocument();
    });
  });

  describe("Address Line 3 Validation", () => {
    it("should accept empty address line 3 (optional field)", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const addressLine1Input = screen.getByLabelText(/address line 1/i);
      const townInput = screen.getByLabelText(/town or city/i);
      const postcodeInput = screen.getByLabelText(/postcode/i);

      fireEvent.change(addressLine1Input, { target: { value: "123 Main Street" } });
      fireEvent.change(townInput, { target: { value: "London" } });
      fireEvent.change(postcodeInput, { target: { value: "SW1A 1AA" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.queryByText(/address line 3 must be/i)).not.toBeInTheDocument();
    });

    it("should return error for invalid special characters in address line 3", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const addressLine3Input = screen.getByLabelText(/address line 3/i);
      fireEvent.change(addressLine3Input, { target: { value: "Area@456" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("Enter address line 3, typically the building and street")).toBeInTheDocument();
    });

    it("should accept valid characters in address line 3", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const addressLine1Input = screen.getByLabelText(/address line 1/i);
      const addressLine3Input = screen.getByLabelText(/address line 3/i);
      const townInput = screen.getByLabelText(/town or city/i);
      const postcodeInput = screen.getByLabelText(/postcode/i);

      fireEvent.change(addressLine1Input, { target: { value: "123 Main Street" } });
      fireEvent.change(addressLine3Input, { target: { value: "District C-4" } });
      fireEvent.change(townInput, { target: { value: "London" } });
      fireEvent.change(postcodeInput, { target: { value: "SW1A 1AA" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.queryByText("Enter address line 3, typically the building and street")).not.toBeInTheDocument();
    });

    it("should return error for address line 3 over 100 characters", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const addressLine3Input = screen.getByLabelText(/address line 3/i);
      const longAddress = "C".repeat(101);
      fireEvent.change(addressLine3Input, { target: { value: longAddress } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("Address line 3 must be 100 characters or less")).toBeInTheDocument();
    });
  });

  describe("Town or City Validation", () => {
    it("should return error for empty town or city", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const addressLine1Input = screen.getByLabelText(/address line 1/i);
      const postcodeInput = screen.getByLabelText(/postcode/i);

      fireEvent.change(addressLine1Input, { target: { value: "123 Main Street" } });
      fireEvent.change(postcodeInput, { target: { value: "SW1A 1AA" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("Enter a city or town")).toBeInTheDocument();
    });

    it("should return error for numbers in town or city", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const townInput = screen.getByLabelText(/town or city/i);
      fireEvent.change(townInput, { target: { value: "London123" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("Enter a city or town")).toBeInTheDocument();
    });

    it("should return error for invalid special characters in town or city", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const townInput = screen.getByLabelText(/town or city/i);
      fireEvent.change(townInput, { target: { value: "London@City" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("Enter a city or town")).toBeInTheDocument();
    });

    it("should accept valid town or city names with allowed special characters", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const addressLine1Input = screen.getByLabelText(/address line 1/i);
      const townInput = screen.getByLabelText(/town or city/i);
      const postcodeInput = screen.getByLabelText(/postcode/i);

      const validTowns = ["London", "St. Mary's", "Newton-le-Willows", "St. Albans"];

      validTowns.forEach((town) => {
        fireEvent.change(addressLine1Input, { target: { value: "123 Main Street" } });
        fireEvent.change(townInput, { target: { value: town } });
        fireEvent.change(postcodeInput, { target: { value: "SW1A 1AA" } });

        const submitButton = screen.getByRole("button", { name: /continue/i });
        fireEvent.click(submitButton);

        expect(screen.queryByText("Enter a city or town")).not.toBeInTheDocument();
      });
    });

    it("should return error for town or city over 100 characters", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const townInput = screen.getByLabelText(/town or city/i);
      const longTown = "A".repeat(101);
      fireEvent.change(townInput, { target: { value: longTown } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("City or town must be 100 characters or less")).toBeInTheDocument();
    });
  });

  describe("Postcode Validation", () => {
    it("should return error for empty postcode", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const addressLine1Input = screen.getByLabelText(/address line 1/i);
      const townInput = screen.getByLabelText(/town or city/i);

      fireEvent.change(addressLine1Input, { target: { value: "123 Main Street" } });
      fireEvent.change(townInput, { target: { value: "London" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("Enter a full UK postcode")).toBeInTheDocument();
    });

    it("should return error for invalid postcode formats", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const postcodeInput = screen.getByLabelText(/postcode/i);
      const invalidPostcodes = ["12345", "ABCDEF", "A12BC 3D", "SW1A"];

      invalidPostcodes.forEach((postcode) => {
        fireEvent.change(postcodeInput, { target: { value: postcode } });

        const submitButton = screen.getByRole("button", { name: /continue/i });
        fireEvent.click(submitButton);

        expect(screen.getByText("Enter a full UK postcode")).toBeInTheDocument();
      });
    });

    it("should return error for postcode over 8 characters", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const postcodeInput = screen.getByLabelText(/postcode/i);
      fireEvent.change(postcodeInput, { target: { value: "SW1A 1AA1" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("Postcode must be 8 characters or less")).toBeInTheDocument();
    });

    it("should accept valid UK postcodes with and without spaces", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const addressLine1Input = screen.getByLabelText(/address line 1/i);
      const townInput = screen.getByLabelText(/town or city/i);
      const postcodeInput = screen.getByLabelText(/postcode/i);

      const validPostcodes = ["SW1A 1AA", "SW1A1AA", "M1 1AE", "B33 8TH", "CR2 6XH", "DN55 1PT"];

      validPostcodes.forEach((postcode) => {
        fireEvent.change(addressLine1Input, { target: { value: "123 Main Street" } });
        fireEvent.change(townInput, { target: { value: "London" } });
        fireEvent.change(postcodeInput, { target: { value: postcode } });

        const submitButton = screen.getByRole("button", { name: /continue/i });
        fireEvent.click(submitButton);

        expect(screen.queryByText("Enter a full UK postcode")).not.toBeInTheDocument();
        expect(screen.queryByText("Postcode must be 8 characters or less")).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should not submit form when validation fails", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("Enter address line 1, typically the building and street")).toBeInTheDocument();
      expect(screen.getByText("Enter a city or town")).toBeInTheDocument();
      expect(screen.getByText("Enter a full UK postcode")).toBeInTheDocument();
    });

    it("should update OrderContext with valid address data", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      const addressLine1Input = screen.getByLabelText(/address line 1/i);
      const addressLine2Input = screen.getByLabelText(/address line 2/i);
      const addressLine3Input = screen.getByLabelText(/address line 3/i);
      const townInput = screen.getByLabelText(/town or city/i);
      const postcodeInput = screen.getByLabelText(/postcode/i);

      fireEvent.change(addressLine1Input, { target: { value: "123 Main Street" } });
      fireEvent.change(addressLine2Input, { target: { value: "Flat 4B" } });
      fireEvent.change(addressLine3Input, { target: { value: "Building A" } });
      fireEvent.change(townInput, { target: { value: "London" } });
      fireEvent.change(postcodeInput, { target: { value: "SW1A 1AA" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.queryByText("Enter address line 1, typically the building and street")).not.toBeInTheDocument();
      expect(screen.queryByText("Enter a city or town")).not.toBeInTheDocument();
      expect(screen.queryByText("Enter a full UK postcode")).not.toBeInTheDocument();
    });
  });
});
