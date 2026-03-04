import { OrderDetails, OrderStatus as OrderStatusEnum } from "@/lib/models/order-details";
import { render, screen } from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";
import { OrderStatus } from "@/components/order-status";

const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe("OrderStatus", () => {
  const mockOrder: OrderDetails = {
    id: "123",
    orderedDate: "2026-01-15",
    referenceNumber: "12345",
    status: OrderStatusEnum.CONFIRMED,
    supplier: "Preventx",
    maxDeliveryDays: 5,
  };

  it("renders OrderStatusHeader component", () => {
    renderWithRouter(<OrderStatus order={mockOrder} />);
    expect(screen.getByRole("heading", { name: "HIV self-test" })).toBeInTheDocument();
    expect(screen.getByText(/15 January 2026/i)).toBeInTheDocument();
  });

  it("renders OrderStatusContent component", () => {
    renderWithRouter(<OrderStatus order={mockOrder} />);
    expect(screen.getByText(/wait for your kit to be dispatched/i)).toBeInTheDocument();
  });

  it("renders both header and content for processing status", () => {
    const processingOrder: OrderDetails = {
      ...mockOrder,
      status: OrderStatusEnum.PROCESSING,
    };
    renderWithRouter(<OrderStatus order={processingOrder} />);

    // Header content
    expect(screen.getByRole("heading", { name: "HIV self-test" })).toBeInTheDocument();

    // Status content
    expect(screen.getByText(/PROCESSING/i)).toBeInTheDocument();
  });

  it("renders both header and content for dispatched status", () => {
    const dispatchedOrder: OrderDetails = {
      ...mockOrder,
      status: OrderStatusEnum.DISPATCHED,
      dispatchedDate: "2026-01-20",
    };
    renderWithRouter(<OrderStatus order={dispatchedOrder} />);

    // Header content
    expect(screen.getByRole("heading", { name: "HIV self-test" })).toBeInTheDocument();

    // Status content
    expect(screen.getByText(/wait for your kit to arrive/i)).toBeInTheDocument();
  });

  it("renders both header and content for received status", () => {
    const receivedOrder: OrderDetails = {
      ...mockOrder,
      status: OrderStatusEnum.RECEIVED,
    };
    renderWithRouter(<OrderStatus order={receivedOrder} />);

    // Header content
    expect(screen.getByRole("heading", { name: "HIV self-test" })).toBeInTheDocument();

    // Status content
    expect(screen.getByText(/wait for your result/i)).toBeInTheDocument();
  });

  it("renders both header and content for complete status", () => {
    const readyOrder: OrderDetails = {
      ...mockOrder,
      status: OrderStatusEnum.COMPLETE,
    };
    renderWithRouter(<OrderStatus order={readyOrder} />);

    // Header content
    expect(screen.getByRole("heading", { name: "HIV self-test" })).toBeInTheDocument();

    // Status content
    expect(screen.getByText(/your result is ready/i)).toBeInTheDocument();
  });
});
