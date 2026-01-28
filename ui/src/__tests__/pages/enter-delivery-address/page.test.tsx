import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import EnterDeliveryAddressPage from "@/app/enter-delivery-address/page";
import { OrderProvider } from "@/app/OrderContext";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Test wrapper with OrderProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <OrderProvider>{children}</OrderProvider>
);

describe("EnterDeliveryAddressPage", () => {
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

  describe("Postcode Validation", () => {
    it("should return error for empty postcode", () => {
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("Enter a full UK postcode")).toBeInTheDocument();
    });

    it("should return error for postcode too long", () => {
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const postcodeInput = screen.getByLabelText(/postcode/i);
      fireEvent.change(postcodeInput, { target: { value: "M1 1AA123" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("Postcode must be 8 characters or less")).toBeInTheDocument();
    });

    it("should return error for invalid postcode format", () => {
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const postcodeInput = screen.getByLabelText(/postcode/i);
      fireEvent.change(postcodeInput, { target: { value: "INVALID" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("Enter a postcode using letters and numbers")).toBeInTheDocument();
    });

    it("should accept valid UK postcodes", () => {
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const postcodeInput = screen.getByLabelText(/postcode/i);
      const validPostcodes = ["M1 1AA", "B33 8TH", "W1A 0AX", "EC1A 1BB"];

      validPostcodes.forEach((postcode) => {
        fireEvent.change(postcodeInput, { target: { value: postcode } });

        const submitButton = screen.getByRole("button", { name: /continue/i });
        fireEvent.click(submitButton);

        expect(screen.queryByText("Enter a full UK postcode")).not.toBeInTheDocument();
        expect(screen.queryByText("Postcode must be 8 characters or less")).not.toBeInTheDocument();
        expect(screen.queryByText("Enter a postcode using letters and numbers")).not.toBeInTheDocument();
      });
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

      expect(screen.getByText("Building number or name must be 100 characters or less")).toBeInTheDocument();
    });

    it("should return error for invalid characters in building name", () => {
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const buildingInput = screen.getByLabelText(/building number or name/i);
      fireEvent.change(buildingInput, { target: { value: "Building@123!" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("Enter the building number or name")).toBeInTheDocument();
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

        expect(screen.queryByText("Building number or name must be 100 characters or less")).not.toBeInTheDocument();
        expect(screen.queryByText("Enter the building number or name")).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should not submit form when validation fails", () => {
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.getByText("Enter a full UK postcode")).toBeInTheDocument();
    });

    it("should update form state when valid data is entered", () => {
      render(<EnterDeliveryAddressPage />, { wrapper: TestWrapper });

      const postcodeInput = screen.getByLabelText(/postcode/i);
      const buildingInput = screen.getByLabelText(/building number or name/i);

      fireEvent.change(postcodeInput, { target: { value: "M1 1AA" } });
      fireEvent.change(buildingInput, { target: { value: "15" } });

      const submitButton = screen.getByRole("button", { name: /continue/i });
      fireEvent.click(submitButton);

      expect(screen.queryByText("Enter a full UK postcode")).not.toBeInTheDocument();
      expect(screen.queryByText("Enter the building number or name")).not.toBeInTheDocument();
    });
  });
});
