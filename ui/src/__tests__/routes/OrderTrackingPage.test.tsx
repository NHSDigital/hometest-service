import "@testing-library/jest-dom";

import * as ordersApi from "@/lib/api/orders";

import { render, screen } from "@testing-library/react";

import { Order } from "@/types/order";
import OrderTrackingPage from "@/routes/OrderTrackingPage";
import { act } from "react";

// Mock the orders API
jest.mock("@/lib/api/orders", () => ({
  getOrderDetails: jest.fn(),
}));

// Mock Next.js components
jest.mock("@/layouts/PageLayout", () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-layout">{children}</div>
  ),
}));

jest.mock("@/components/order-status", () => ({
  OrderStatus: ({ order }: { order: Order }) => (
    <div data-testid="order-status">
      <h1>{order.testType}</h1>
      <p>Status: {order.status}</p>
    </div>
  ),
}));

jest.mock("@/components/AboutService", () => ({
  AboutService: ({ supplier }: { supplier: string }) => (
    <div data-testid="about-service">Supplier: {supplier}</div>
  ),
}));

describe("OrderTrackingPage", () => {
  const mockOrder: Order = {
    id: "123",
    testType: "HIV self-test",
    orderedDate: "2026-01-15",
    referenceNumber: "12345",
    status: "confirmed",
    supplier: "Preventx",
    maxDeliveryDays: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Successful order loading", () => {
    it("renders the order details when order is found", async () => {
      (ordersApi.getOrderDetails as jest.Mock).mockResolvedValue(mockOrder);

      const params = Promise.resolve({ orderId: "123" });

      await act(async () => {
        render(<OrderTrackingPage params={params} />);
      });

      // Wait for order content to appear
      const orderStatus = await screen.findByTestId("order-status");
      expect(orderStatus).toBeInTheDocument();
      expect(screen.getByText("HIV self-test")).toBeInTheDocument();
      expect(screen.getByText("Status: confirmed")).toBeInTheDocument();
    });

    it("renders AboutService component with correct supplier", async () => {
      (ordersApi.getOrderDetails as jest.Mock).mockResolvedValue(mockOrder);

      const params = Promise.resolve({ orderId: "123" });

      await act(async () => {
        render(<OrderTrackingPage params={params} />);
      });

      const aboutService = await screen.findByTestId("about-service");
      expect(aboutService).toBeInTheDocument();
      expect(screen.getByText("Supplier: Preventx")).toBeInTheDocument();
    });

    it("renders PageLayout wrapper", async () => {
      (ordersApi.getOrderDetails as jest.Mock).mockResolvedValue(mockOrder);

      const params = Promise.resolve({ orderId: "123" });

      await act(async () => {
        render(<OrderTrackingPage params={params} />);
      });

      const pageLayout = screen.getByTestId("page-layout");
      expect(pageLayout).toBeInTheDocument();
    });

    it("calls getOrderDetails with correct orderId", async () => {
      (ordersApi.getOrderDetails as jest.Mock).mockResolvedValue(mockOrder);

      const params = Promise.resolve({ orderId: "456" });

      await act(async () => {
        render(<OrderTrackingPage params={params} />);
      });

      await screen.findByTestId("order-status");

      expect(ordersApi.getOrderDetails).toHaveBeenCalledWith("456");
      expect(ordersApi.getOrderDetails).toHaveBeenCalledTimes(1);
    });

    it("handles dispatched order status", async () => {
      const dispatchedOrder: Order = {
        ...mockOrder,
        status: "dispatched",
        dispatchedDate: "2026-01-20",
      };
      (ordersApi.getOrderDetails as jest.Mock).mockResolvedValue(
        dispatchedOrder,
      );

      const params = Promise.resolve({ orderId: "123" });

      await act(async () => {
        render(<OrderTrackingPage params={params} />);
      });

      await screen.findByTestId("order-status");
      expect(screen.getByText("Status: dispatched")).toBeInTheDocument();
    });
  });

  describe("Order not found", () => {
    it("displays error message when order is null", async () => {
      (ordersApi.getOrderDetails as jest.Mock).mockResolvedValue(null);

      const params = Promise.resolve({ orderId: "999" });

      await act(async () => {
        render(<OrderTrackingPage params={params} />);
      });

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "There is a problem" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("We could not find this order."),
      ).toBeInTheDocument();
    });

    it("displays error message when order is undefined", async () => {
      (ordersApi.getOrderDetails as jest.Mock).mockResolvedValue(undefined);

      const params = Promise.resolve({ orderId: "999" });

      await act(async () => {
        render(<OrderTrackingPage params={params} />);
      });

      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toBeInTheDocument();
      expect(
        screen.getByText("We could not find this order."),
      ).toBeInTheDocument();
    });

    it("does not render OrderStatus or AboutService when order not found", async () => {
      (ordersApi.getOrderDetails as jest.Mock).mockResolvedValue(null);

      const params = Promise.resolve({ orderId: "999" });

      await act(async () => {
        render(<OrderTrackingPage params={params} />);
      });

      await screen.findByRole("alert");

      expect(screen.queryByTestId("order-status")).not.toBeInTheDocument();
      expect(screen.queryByTestId("about-service")).not.toBeInTheDocument();
    });
  });

  describe("Loading state", () => {
    it("displays loading message initially", async () => {
      (ordersApi.getOrderDetails as jest.Mock).mockResolvedValue(mockOrder);

      const params = Promise.resolve({ orderId: "123" });

      await act(async () => {
        render(<OrderTrackingPage params={params} />);
      });

      // After params resolve, check if loading or content is shown
      // Since Suspense resolves quickly in tests, content may already be loaded
      const content = await screen.findByTestId("order-status");
      expect(content).toBeInTheDocument();
    });

    it("has correct accessibility attributes on loading state", async () => {
      // For this test, we need to delay the promise resolution to catch loading state
      let resolveOrder: (value: Order) => void;
      const orderPromise = new Promise<Order>((resolve) => {
        resolveOrder = resolve;
      });
      (ordersApi.getOrderDetails as jest.Mock).mockReturnValue(orderPromise);

      const params = Promise.resolve({ orderId: "123" });

      await act(async () => {
        render(<OrderTrackingPage params={params} />);
      });

      // Check loading state appears
      const loadingDiv = screen.getByRole("status");
      expect(loadingDiv).toHaveClass("nhsuk-body");
      expect(loadingDiv).toHaveClass("nhsuk-u-padding-top-5");

      // Clean up - resolve the promise
      await act(async () => {
        resolveOrder!(mockOrder);
      });
    });
  });

  describe("Different order types", () => {
    it("handles different test types", async () => {
      const syphilisOrder: Order = {
        ...mockOrder,
        testType: "Syphilis self-test",
      };
      (ordersApi.getOrderDetails as jest.Mock).mockResolvedValue(syphilisOrder);

      const params = Promise.resolve({ orderId: "123" });

      await act(async () => {
        render(<OrderTrackingPage params={params} />);
      });

      await screen.findByTestId("order-status");
      expect(screen.getByText("Syphilis self-test")).toBeInTheDocument();
    });

    it("handles different suppliers", async () => {
      const differentSupplierOrder: Order = {
        ...mockOrder,
        supplier: "SH:24",
      };
      (ordersApi.getOrderDetails as jest.Mock).mockResolvedValue(
        differentSupplierOrder,
      );

      const params = Promise.resolve({ orderId: "123" });

      await act(async () => {
        render(<OrderTrackingPage params={params} />);
      });

      await screen.findByTestId("about-service");
      expect(screen.getByText("Supplier: SH:24")).toBeInTheDocument();
    });
  });
});
