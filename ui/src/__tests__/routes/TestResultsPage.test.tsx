import "@testing-library/jest-dom";

import { AuthUser, useAuth } from "@/state/AuthContext";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { OrderDetails, OrderStatus } from "@/lib/models/order-details";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import TestResultsPage from "@/routes/TestResultsPage";
import { act } from "react";
import orderDetailsService from "@/lib/services/order-details-service";
import testResultsService from "@/lib/services/test-results-service";

jest.mock("@/lib/services/order-details-service", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock("@/lib/services/test-results-service", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock("@/state/AuthContext");

jest.mock("@/layouts/PageLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-layout">{children}</div>
  ),
}));

jest.mock("@/components/order-status", () => ({
  OrderStatusHeader: ({ order }: { order: OrderDetails }) => (
    <div data-testid="order-status-header">Order: {order.referenceNumber}</div>
  ),
}));

describe("TestResultsPage", () => {
  const orderId = "550e8400-e29b-41d4-a716-446655440000";

  const mockOrder: OrderDetails = {
    id: orderId,
    orderedDate: "2026-01-15",
    referenceNumber: "12345",
    status: OrderStatus.COMPLETE,
    supplier: "Preventx",
    maxDeliveryDays: 5,
  };

  const mockIncompleteOrder: OrderDetails = {
    ...mockOrder,
    status: OrderStatus.CONFIRMED,
  };
  const mockResult = { id: "obs-1", isNormal: true };

  const mockUser: AuthUser = {
    sub: "test-user-123",
    nhsNumber: "2657119018",
    birthdate: "1990-08-11",
    identityProofingLevel: "P9",
    phoneNumber: "07700900000",
    givenName: "Test",
    familyName: "Surname",
    email: "john.smith@example.com",
  };

  const renderWithRouter = (currentOrderId: string) => {
    const queryClient = new QueryClient();

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/orders/${currentOrderId}/results`]}>
          <Routes>
            <Route path="/orders/:orderId/results" element={<TestResultsPage />} />
            <Route
              path="/orders/:orderId/tracking"
              element={<div data-testid="order-tracking-page" />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      setUser: jest.fn(),
    });
  });

  it("renders order status header when result is found", async () => {
    (orderDetailsService.get as jest.Mock).mockResolvedValue(mockOrder);
    (testResultsService.get as jest.Mock).mockResolvedValue(mockResult);

    await act(async () => {
      renderWithRouter(orderId);
    });

    const header = await screen.findByTestId("order-status-header");
    expect(header).toBeInTheDocument();
    expect(screen.getByText("Order: 12345")).toBeInTheDocument();
    expect(screen.getByText("Your result")).toBeInTheDocument();
    expect(screen.getByText("Negative")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "More options and information" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "About this service" })).toBeInTheDocument();
    expect(orderDetailsService.get).toHaveBeenCalledWith(orderId, {
      nhsNumber: "2657119018",
      dateOfBirth: "1990-08-11",
    });
    expect(testResultsService.get).toHaveBeenCalledWith(orderId, {
      nhsNumber: "2657119018",
      dateOfBirth: "1990-08-11",
    });
  });

  it("redirects to order tracking page when API returns 404", async () => {
    (orderDetailsService.get as jest.Mock).mockResolvedValue(mockOrder);
    (testResultsService.get as jest.Mock).mockResolvedValue(null);

    await act(async () => {
      renderWithRouter(orderId);
    });

    expect(await screen.findByTestId("order-tracking-page")).toBeInTheDocument();
  });

  it("redirects to order tracking page when result is not normal", async () => {
    (orderDetailsService.get as jest.Mock).mockResolvedValue(mockOrder);
    (testResultsService.get as jest.Mock).mockResolvedValue({
      id: "obs-2",
      isNormal: false,
    });

    await act(async () => {
      renderWithRouter(orderId);
    });

    expect(await screen.findByTestId("order-tracking-page")).toBeInTheDocument();
  });

  it("redirects to order tracking page when order is not complete", async () => {
    (orderDetailsService.get as jest.Mock).mockResolvedValue(mockIncompleteOrder);
    (testResultsService.get as jest.Mock).mockResolvedValue(mockResult);

    await act(async () => {
      renderWithRouter(orderId);
    });

    expect(await screen.findByTestId("order-tracking-page")).toBeInTheDocument();
    expect(testResultsService.get).not.toHaveBeenCalled();
  });

  it("redirects to order tracking page when order does not exist", async () => {
    (orderDetailsService.get as jest.Mock).mockResolvedValue(null);

    await act(async () => {
      renderWithRouter(orderId);
    });

    expect(await screen.findByTestId("order-tracking-page")).toBeInTheDocument();
    expect(testResultsService.get).not.toHaveBeenCalled();
  });

  it("shows invalid order id error and does not call API", () => {
    renderWithRouter("not-a-guid");

    const errorSummaryHeading = screen.getByRole("heading", { name: "There is a problem" });
    const errorSummary = errorSummaryHeading.closest('[role="alert"]');
    expect(errorSummary).toBeInTheDocument();
    expect(screen.getByText("Order ID is required.")).toBeInTheDocument();
    expect(orderDetailsService.get).not.toHaveBeenCalled();
    expect(testResultsService.get).not.toHaveBeenCalled();
  });
});
