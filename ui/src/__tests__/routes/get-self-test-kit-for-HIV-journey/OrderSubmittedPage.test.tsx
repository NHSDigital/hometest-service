import { CreateOrderProvider, JourneyNavigationProvider, useCreateOrderContext } from "@/state";
import { render, screen } from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";
import OrderSubmittedPage from "@/routes/get-self-test-kit-for-HIV-journey/OrderSubmittedPage";
import { useEffect } from "react";

const mockGoToStep = jest.fn();
const mockSetReturnToStep = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@/state", () => {
  const actual = jest.requireActual("@/state");
  return {
    ...actual,
    useJourneyNavigationContext: () => ({
      currentStep: "order-submitted",
      stepHistory: ["check-your-answers", "order-submitted"],
      returnToStep: null,
      goToStep: mockGoToStep,
      goBack: mockGoBack,
      canGoBack: () => false,
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
  orderReferenceNumber: "ORD-12345-TEST",
  supplier: [
    {
      id: "SUP1",
      name: "Preventx",
      testCode: "31676001",
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
  <MemoryRouter initialEntries={["/get-self-test-kit-for-HIV/order-submitted"]}>
    <JourneyNavigationProvider>
      <CreateOrderProvider>
        <StateSeeder orderData={orderData}>{children}</StateSeeder>
      </CreateOrderProvider>
    </JourneyNavigationProvider>
  </MemoryRouter>
);

describe("OrderSubmittedPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders the order submitted panel title", () => {
      render(<OrderSubmittedPage />, { wrapper: TestWrapper });

      const panelTitle = screen.getByRole("heading", {
        name: /order submitted/i,
      });
      expect(panelTitle).toBeInTheDocument();
    });

    it("renders the reference number", () => {
      render(<OrderSubmittedPage />, { wrapper: TestWrapper });

      expect(screen.getByText(/your reference number/i)).toBeInTheDocument();
      expect(screen.getByText(/ORD-12345-TEST/i)).toBeInTheDocument();
    });

    it("renders the what happens next heading", () => {
      render(<OrderSubmittedPage />, { wrapper: TestWrapper });

      const whatHappensNextHeading = screen.getByRole("heading", {
        name: /what happens next:/i,
      });
      expect(whatHappensNextHeading).toBeInTheDocument();
    });

    it("renders the feedback section", () => {
      render(<OrderSubmittedPage />, { wrapper: TestWrapper });

      expect(
        screen.getByText(/this is a new service. help us improve it and/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/give your feedback/i)).toBeInTheDocument();
    });

    it("renders a feedback link", () => {
      render(<OrderSubmittedPage />, { wrapper: TestWrapper });

      const feedbackLink = screen.getByRole("link", {
        name: /give your feedback/i,
      });
      expect(feedbackLink).toBeInTheDocument();
    });
  });

  describe("Dynamic Supplier Rendering", () => {
    it("displays the supplier name in the confirmation message", () => {
      render(<OrderSubmittedPage />, { wrapper: TestWrapper });

      expect(
        screen.getByText(/preventx will send you a text message confirming the order/i),
      ).toBeInTheDocument();
    });

    it("displays fallback supplier name when supplier data is missing", () => {
      const orderDataWithoutSupplier = {
        ...defaultOrderData,
        supplier: undefined,
      };

      render(<OrderSubmittedPage />, {
        wrapper: (props) => <TestWrapper orderData={orderDataWithoutSupplier} {...props} />,
      });

      expect(
        screen.getByText(/\[supplier\] will send you a text message confirming the order/i),
      ).toBeInTheDocument();
    });

    it("displays fallback supplier name when supplier array is empty", () => {
      const orderDataWithEmptySupplier = {
        ...defaultOrderData,
        supplier: [],
      };

      render(<OrderSubmittedPage />, {
        wrapper: (props) => <TestWrapper orderData={orderDataWithEmptySupplier} {...props} />,
      });

      expect(
        screen.getByText(/\[supplier\] will send you a text message confirming the order/i),
      ).toBeInTheDocument();
    });

    it("displays different supplier name when provided", () => {
      const orderDataWithDifferentSupplier = {
        ...defaultOrderData,
        supplier: [
          {
            id: "SUP2",
            name: "Test Medical Supplies",
            testCode: "PCR",
          },
        ],
      };

      render(<OrderSubmittedPage />, {
        wrapper: (props) => <TestWrapper orderData={orderDataWithDifferentSupplier} {...props} />,
      });

      expect(
        screen.getByText(
          /test medical supplies will send you a text message confirming the order/i,
        ),
      ).toBeInTheDocument();
    });
  });

  describe("What Happens Next Section", () => {
    it("displays all four steps in the correct order", () => {
      render(<OrderSubmittedPage />, { wrapper: TestWrapper });

      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(4);

      expect(listItems[0]).toHaveTextContent(
        /preventx will send you a text message confirming the order/i,
      );
      expect(listItems[1]).toHaveTextContent(
        /the self-test kit will then be sent to you within 5 working days/i,
      );
      expect(listItems[2]).toHaveTextContent(
        /you will receive updates through the app to help you keep track of your order/i,
      );
      expect(listItems[3]).toHaveTextContent(/you do not need to do anything else at this stage/i);
    });

    it("displays the timeline with max days", () => {
      render(<OrderSubmittedPage />, { wrapper: TestWrapper });

      expect(
        screen.getByText(/the self-test kit will then be sent to you within 5 working days/i),
      ).toBeInTheDocument();
    });
  });

  describe("Reference Number", () => {
    it("displays default reference number when not provided", () => {
      const orderDataWithoutReference = {
        ...defaultOrderData,
        orderReferenceNumber: undefined,
      };

      render(<OrderSubmittedPage />, {
        wrapper: (props) => <TestWrapper orderData={orderDataWithoutReference} {...props} />,
      });

      expect(screen.getByText(/\[Reference Number\]/)).toBeInTheDocument();
    });

    it("displays provided reference number", () => {
      render(<OrderSubmittedPage />, { wrapper: TestWrapper });

      expect(screen.getByText(/ORD-12345-TEST/i)).toBeInTheDocument();
    });
  });
});
