import "@testing-library/jest-dom";

import { AuthContext, AuthUser } from "@/state/AuthContext";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { OrderDetails, OrderStatus } from "@/lib/models/order-details";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import OrderTrackingPage from "@/routes/OrderTrackingPage";
import { TestErrorBoundary } from "@/lib/test-utils/TestErrorBoundary";
import { act } from "react";
import orderDetailsService from "@/lib/services/order-details-service";

jest.mock("@/lib/services/order-details-service", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock("@/layouts/PageLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-layout">{children}</div>
  ),
}));

jest.mock("@/components/order-status", () => ({
  OrderStatus: ({ order }: { order: OrderDetails }) => (
    <div data-testid="order-status">
      <h1>HIV self-test</h1>
      <p>Status: {order.status}</p>
    </div>
  ),
}));

jest.mock("@/components/AboutService", () => ({
  AboutService: ({ supplier }: { supplier: string }) => (
    <div data-testid="about-service">Supplier: {supplier}</div>
  ),
}));

const mockUser: AuthUser = {
  sub: "test-user-123",
  nhsNumber: "2657119018",
  birthdate: "1990-08-11",
  identityProofingLevel: "P9",
  phoneNumber: "07700900000",
  givenName: "John",
  familyName: "Smith",
  email: "john.smith@example.com",
};

const renderWithRouter = (orderId: string, options?: { withErrorBoundary?: boolean }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const routeElement = (
    <Routes>
      <Route path="/orders/:orderId/tracking" element={<OrderTrackingPage />} />
    </Routes>
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          user: mockUser,
          setUser: jest.fn(),
        }}
      >
        <MemoryRouter initialEntries={[`/orders/${orderId}/tracking`]}>
          {options?.withErrorBoundary ? (
            <TestErrorBoundary>{routeElement}</TestErrorBoundary>
          ) : (
            routeElement
          )}
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
};

describe("OrderTrackingPage", () => {
  const orderId = "550e8400-e29b-41d4-a716-446655440000";
  const mockOrder: OrderDetails = {
    id: orderId,
    orderedDate: "2026-01-15",
    referenceNumber: "12345",
    status: OrderStatus.CONFIRMED,
    supplier: "Preventx",
    maxDeliveryDays: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Successful order loading", () => {
    it("renders the order details when order is found", async () => {
      (orderDetailsService.get as jest.Mock).mockResolvedValue(mockOrder);

      await act(async () => {
        renderWithRouter(orderId);
      });

      // Wait for order content to appear
      const orderStatus = await screen.findByTestId("order-status");
      expect(orderStatus).toBeInTheDocument();
      expect(screen.getByText("HIV self-test")).toBeInTheDocument();
      expect(screen.getByText("Status: CONFIRMED")).toBeInTheDocument();
    });

    it("renders AboutService component with correct supplier", async () => {
      (orderDetailsService.get as jest.Mock).mockResolvedValue(mockOrder);

      await act(async () => {
        renderWithRouter(orderId);
      });

      const aboutService = await screen.findByTestId("about-service");
      expect(aboutService).toBeInTheDocument();
      expect(screen.getByText("Supplier: Preventx")).toBeInTheDocument();
    });

    it("renders PageLayout wrapper", async () => {
      (orderDetailsService.get as jest.Mock).mockResolvedValue(mockOrder);

      await act(async () => {
        renderWithRouter(orderId);
      });

      const pageLayout = screen.getByTestId("page-layout");
      expect(pageLayout).toBeInTheDocument();
    });

    it("calls get with correct orderId and patient", async () => {
      (orderDetailsService.get as jest.Mock).mockResolvedValue(mockOrder);

      await act(async () => {
        renderWithRouter(orderId);
      });

      await screen.findByTestId("order-status");

      expect(orderDetailsService.get).toHaveBeenCalledWith(orderId, {
        nhsNumber: "2657119018",
        dateOfBirth: "1990-08-11",
      });
      expect(orderDetailsService.get).toHaveBeenCalledTimes(1);
    });

    it("handles dispatched order status", async () => {
      const dispatchedOrder: OrderDetails = {
        ...mockOrder,
        status: OrderStatus.DISPATCHED,
        dispatchedDate: "2026-01-20",
      };
      (orderDetailsService.get as jest.Mock).mockResolvedValue(dispatchedOrder);

      await act(async () => {
        renderWithRouter(orderId);
      });

      await screen.findByTestId("order-status");
      expect(screen.getByText("Status: DISPATCHED")).toBeInTheDocument();
    });

    it("does not render error alert while query is pending", async () => {
      (orderDetailsService.get as jest.Mock).mockImplementation(() => new Promise(() => {}));

      await act(async () => {
        renderWithRouter(orderId);
      });

      expect(screen.getByTestId("page-layout")).toBeInTheDocument();

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "There is a problem" })).not.toBeInTheDocument();
      expect(screen.queryByTestId("order-status")).not.toBeInTheDocument();
      expect(screen.queryByTestId("about-service")).not.toBeInTheDocument();
    });
  });

  describe("Order not found", () => {
    it("displays error message when order is null", async () => {
      (orderDetailsService.get as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        renderWithRouter(orderId);
      });

      const errorHeading = await screen.findByRole("heading", { name: "There is a problem" });
      const errorAlert = errorHeading.closest('[role="alert"]');
      expect(errorAlert).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "There is a problem" })).toBeInTheDocument();
      expect(screen.getByText("We could not find this order.")).toBeInTheDocument();
    });

    it("does not render OrderStatus or AboutService when order not found", async () => {
      (orderDetailsService.get as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        renderWithRouter(orderId);
      });

      await screen.findAllByRole("alert");

      expect(screen.queryByTestId("order-status")).not.toBeInTheDocument();
      expect(screen.queryByTestId("about-service")).not.toBeInTheDocument();
    });

    it("throws query error to error boundary when order lookup fails", async () => {
      const apiError = new Error("order lookup failed");
      (orderDetailsService.get as jest.Mock).mockRejectedValue(apiError);

      await act(async () => {
        renderWithRouter(orderId, { withErrorBoundary: true });
      });

      expect(await screen.findByText("order lookup failed")).toBeInTheDocument();
      expect(screen.queryByTestId("order-status")).not.toBeInTheDocument();
      expect(screen.queryByTestId("about-service")).not.toBeInTheDocument();
    });
  });

  describe("Different order types", () => {
    it("handles different test types", async () => {
      const syphilisOrder: OrderDetails = {
        ...mockOrder,
      };
      (orderDetailsService.get as jest.Mock).mockResolvedValue(syphilisOrder);

      await act(async () => {
        renderWithRouter(orderId);
      });

      await screen.findByTestId("order-status");
      expect(screen.getByText("HIV self-test")).toBeInTheDocument();
    });

    it("handles different suppliers", async () => {
      const differentSupplierOrder: OrderDetails = {
        ...mockOrder,
        supplier: "SH:24",
      };
      (orderDetailsService.get as jest.Mock).mockResolvedValue(differentSupplierOrder);

      await act(async () => {
        renderWithRouter(orderId);
      });

      await screen.findByTestId("about-service");
      expect(screen.getByText("Supplier: SH:24")).toBeInTheDocument();
    });
  });

  describe("Invalid order ID validation", () => {
    it("displays error for invalid GUID format", async () => {
      const invalidOrderId = "invalid-id-123";

      renderWithRouter(invalidOrderId);

      const errorHeading = screen.getByRole("heading", { name: "There is a problem" });
      const errorAlert = errorHeading.closest('[role="alert"]');
      expect(errorAlert).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "There is a problem" })).toBeInTheDocument();
      expect(screen.getByText("Order ID is required.")).toBeInTheDocument();

      // Should not call service with invalid ID
      expect(orderDetailsService.get).not.toHaveBeenCalled();
    });

    it("displays error for malformed GUID", async () => {
      const malformedGuid = "550e8400-e29b-41d4-a716";

      renderWithRouter(malformedGuid);

      const errorHeading = screen.getByRole("heading", { name: "There is a problem" });
      const errorAlert = errorHeading.closest('[role="alert"]');
      expect(errorAlert).toBeInTheDocument();
      expect(screen.getByText("Order ID is required.")).toBeInTheDocument();
      expect(orderDetailsService.get).not.toHaveBeenCalled();
    });

    it("renders PageLayout for invalid order ID", async () => {
      const invalidOrderId = "not-a-guid";

      renderWithRouter(invalidOrderId);

      const pageLayout = screen.getByTestId("page-layout");
      expect(pageLayout).toBeInTheDocument();
    });

    it("does not render OrderStatus or AboutService for invalid ID", async () => {
      const invalidOrderId = "abc123";

      renderWithRouter(invalidOrderId);

      expect(screen.queryByTestId("order-status")).not.toBeInTheDocument();
      expect(screen.queryByTestId("about-service")).not.toBeInTheDocument();
    });
  });
});
