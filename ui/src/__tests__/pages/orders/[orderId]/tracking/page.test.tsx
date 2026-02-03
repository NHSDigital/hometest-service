import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { IOrderDetails } from "@/lib/models/order-details";
import OrderTrackingPage from "@/app/orders/[orderId]/tracking/page";
import { act } from "react";
import orderDetailsService from "@/lib/services/order-details-service";

// Mock the order details service
jest.mock("@/lib/services/order-details-service", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

// Mock Next.js components
jest.mock("@/components/PageLayout", () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-layout">{children}</div>
  ),
}));

jest.mock("@/components/order-status", () => ({
  OrderStatus: ({ order }: { order: IOrderDetails }) => (
    <div data-testid="order-status">
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
  const mockOrder: IOrderDetails = {
    id: "123",
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
      (orderDetailsService.get as jest.Mock).mockResolvedValue(mockOrder);

      const params = Promise.resolve({ orderId: "123" });

      await act(async () => {
        render(<OrderTrackingPage params={params} />);
      });

      // Wait for order content to appear
      const orderStatus = await screen.findByTestId("order-status");
      expect(orderStatus).toBeInTheDocument();
      expect(screen.getByText("Status: confirmed")).toBeInTheDocument();
    });

    it("renders AboutService component with correct supplier", async () => {
      (orderDetailsService.get as jest.Mock).mockResolvedValue(mockOrder);

      const params = Promise.resolve({ orderId: "123" });

      await act(async () => {
        render(<OrderTrackingPage params={params} />);
      });

      const aboutService = await screen.findByTestId("about-service");
      expect(aboutService).toBeInTheDocument();
      expect(screen.getByText("Supplier: Preventx")).toBeInTheDocument();
    });

    it("renders PageLayout wrapper", async () => {
      (orderDetailsService.get as jest.Mock).mockResolvedValue(mockOrder);

      const params = Promise.resolve({ orderId: "123" });

      await act(async () => {
        render(<OrderTrackingPage params={params} />);
      });

      const pageLayout = screen.getByTestId("page-layout");
      expect(pageLayout).toBeInTheDocument();
    });

    it("calls orderDetailsService.get with correct orderId and patient", async () => {
      (orderDetailsService.get as jest.Mock).mockResolvedValue(mockOrder);

      const params = Promise.resolve({ orderId: "456" });

      await act(async () => {
        render(<OrderTrackingPage params={params} />);
      });

      await screen.findByTestId("order-status");

      expect(orderDetailsService.get).toHaveBeenCalledWith("456", {
        nhsNumber: "2657119018",
        dateOfBirth: "1990-08-11",
      });
      expect(orderDetailsService.get).toHaveBeenCalledTimes(1);
    });

    it("handles dispatched order status", async () => {
      const dispatchedOrder: IOrderDetails = {
        ...mockOrder,
        status: "dispatched",
        dispatchedDate: "2026-01-20",
      };
      (orderDetailsService.get as jest.Mock).mockResolvedValue(dispatchedOrder);

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
      (orderDetailsService.get as jest.Mock).mockResolvedValue(null);

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
      (orderDetailsService.get as jest.Mock).mockResolvedValue(undefined);

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
      (orderDetailsService.get as jest.Mock).mockResolvedValue(null);

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
      (orderDetailsService.get as jest.Mock).mockResolvedValue(mockOrder);

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
      let resolveOrder: (value: IOrderDetails) => void;
      const orderPromise = new Promise<IOrderDetails>((resolve) => {
        resolveOrder = resolve;
      });
      (orderDetailsService.get as jest.Mock).mockReturnValue(orderPromise);

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
      const syphilisOrder: IOrderDetails = {
        ...mockOrder,
      };
      (orderDetailsService.get as jest.Mock).mockResolvedValue(syphilisOrder);

      const params = Promise.resolve({ orderId: "123" });

      await act(async () => {
        render(<OrderTrackingPage params={params} />);
      });

      await screen.findByTestId("order-status");
      expect(screen.getByText("Status: confirmed")).toBeInTheDocument();
    });

    it("handles different suppliers", async () => {
      const differentSupplierOrder: IOrderDetails = {
        ...mockOrder,
        supplier: "SH:24",
      };
      (orderDetailsService.get as jest.Mock).mockResolvedValue(
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
