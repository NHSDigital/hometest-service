import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import EnterAddressManuallyPage from "@/routes/get-self-test-kit-for-HIV-journey/EnterAddressManuallyPage";
import { MemoryRouter } from "react-router-dom";
import { CreateOrderProvider, useCreateOrderContext } from "@/state/OrderContext";
import { JourneyNavigationProvider, useJourneyNavigationContext } from "@/state/NavigationContext";
import { AuthProvider, useAuth } from "@/state";
import laLookupService from "@/lib/services/la-lookup-service";

const FIXED_TODAY = new Date(2026, 2, 4); // March 4, 2026

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

jest.mock("@/state", () => {
  const actual = jest.requireActual("@/state");
  return {
    ...actual,
    useAuth: jest.fn(),
  };
});

const mockUser = {
  sub: "",
  nhsNumber: "",
  birthdate: "1990-01-01",
  identityProofingLevel: "",
  phoneNumber: "",
  givenName: "",
  familyName: "",
  email: "",
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/get-self-test-kit-for-HIV/enter-address-manually"]}>
    <JourneyNavigationProvider>
      <AuthProvider>
        <CreateOrderProvider>{children}</CreateOrderProvider>
      </AuthProvider>
    </JourneyNavigationProvider>
  </MemoryRouter>
);

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

describe("EnterAddressManuallyPage", () => {
  const mockedGetByPostcode = laLookupService.getByPostcode as jest.Mock;

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

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(FIXED_TODAY);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe("Component Rendering", () => {
    it("renders the main heading", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      expect(
        screen.getByRole("heading", {
          name: /enter your delivery address manually and we'll check if the kit's available/i,
        }),
      ).toBeInTheDocument();
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

  describe("Loading state", () => {
    it("does not show a loading spinner on initial render", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      expect(screen.queryByRole("heading", { name: "Loading" })).not.toBeInTheDocument();
    });

    it("shows a loading spinner while LA lookup is in progress", async () => {
      mockedGetByPostcode.mockImplementation(() => new Promise(() => {}));

      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      fillValidRequiredFields();
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Loading" })).toBeInTheDocument();
      });

      expect(
        screen.queryByRole("heading", {
          name: /enter your delivery address manually/i,
        }),
      ).not.toBeInTheDocument();
    });
  });

  describe("ErrorSummary", () => {
    it("shows error summary when validation fails", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      const errorSummaryHeading = screen.getByRole("heading", { name: "There is a problem" });
      const errorSummary = errorSummaryHeading.closest(
        '[role="alert"][aria-labelledby="error-summary-title"]',
      );
      expect(errorSummary).toBeInTheDocument();
    });

    it("links to town field and focuses it", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      const townInput = screen.getByLabelText(/town or city/i);

      const link = screen.getByRole("link", {
        name: "Enter a city or town",
      });

      fireEvent.click(link);

      expect(townInput).toHaveFocus();
    });

    it("links to postcode field and focuses it", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      const postcodeInput = screen.getByLabelText(/postcode/i);

      const link = screen.getByRole("link", {
        name: "Enter a full UK postcode",
      });

      fireEvent.click(link);

      expect(postcodeInput).toHaveFocus();
    });
  });

  describe("Address Validation", () => {
    it("validates empty address line 1", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      expect(
        screen.getAllByText("Enter address line 1, typically the building and street"),
      ).toHaveLength(2);
    });

    it("validates invalid characters in address line 1", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      fireEvent.change(screen.getByLabelText(/address line 1/i), {
        target: { value: "123 Main St@" },
      });

      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      expect(
        screen.getAllByText("Enter address line 1, typically the building and street"),
      ).toHaveLength(2);
    });

    it("accepts valid address characters", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      fireEvent.change(screen.getByLabelText(/address line 1/i), {
        target: { value: "123-A Main St, Flat 4B (O'Connor & Sons)" },
      });

      fireEvent.change(screen.getByLabelText(/town or city/i), {
        target: { value: "London" },
      });

      fireEvent.change(screen.getByLabelText(/postcode/i), {
        target: { value: "SW1A 1AA" },
      });

      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      expect(
        screen.queryByText("Enter address line 1, typically the building and street"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Postcode Validation", () => {
    it("shows error for empty postcode", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      fireEvent.change(screen.getByLabelText(/address line 1/i), {
        target: { value: "123 Main Street" },
      });

      fireEvent.change(screen.getByLabelText(/town or city/i), {
        target: { value: "London" },
      });

      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      expect(screen.getAllByText("Enter a full UK postcode")).toHaveLength(2);
    });

    it("accepts valid UK postcode", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      fillValidRequiredFields();

      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      expect(screen.queryByText("Enter a full UK postcode")).not.toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("does not submit when validation fails", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      const errorSummaryHeading = screen.getByRole("heading", { name: "There is a problem" });
      const errorSummary = errorSummaryHeading.closest(
        '[role="alert"][aria-labelledby="error-summary-title"]',
      );
      expect(errorSummary).toBeInTheDocument();
    });

    it("submits valid form without errors", () => {
      render(<EnterAddressManuallyPage />, { wrapper: TestWrapper });

      fillValidRequiredFields();

      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      expect(
        document.querySelector('[role="alert"][aria-labelledby="error-summary-title"]'),
      ).not.toBeInTheDocument();
    });
  });

  describe("Eligibility Check", () => {
    it.each([
      ["LA lookup returns null", null],
      [
        "LA lookup returns empty suppliers",
        {
          localAuthority: {
            localAuthorityCode: "4230",
            region: "Salford",
          },
          suppliers: [],
        },
      ],
    ])("navigates to kit-not-available when %s", async (_, response) => {
      mockedGetByPostcode.mockResolvedValueOnce(response);

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
    });
  });

  describe("Under 18 Navigation", () => {
    it("navigates to under 18 step", async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {
          ...mockUser,
          birthdate: "2010-01-01",
        },
      });

      let resolvePostcodeLookup!: (value: object) => void;
      mockedGetByPostcode.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePostcodeLookup = resolve;
          }),
      );

      render(
        <>
          <EnterAddressManuallyPage />
          <ContextObserver />
        </>,
        { wrapper: TestWrapper },
      );

      fillValidRequiredFields();
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      await act(async () => {
        resolvePostcodeLookup({
          localAuthority: { localAuthorityCode: "4230", region: "Salford" },
          suppliers: [{ id: "SUP1", name: "Supplier One", testCode: "31676001" }],
        });
      });

      expect(screen.getByTestId("current-step")).toHaveTextContent("cannot-use-service-under-18");
    });
  });
});
