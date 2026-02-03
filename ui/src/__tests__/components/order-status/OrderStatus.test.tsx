import { render, screen } from "@testing-library/react";

import { IOrderDetails } from "@/lib/models/order-details";
import { OrderStatus } from "@/components/order-status";

describe("OrderStatus", () => {
  const mockOrder: IOrderDetails = {
    id: "123",
    orderedDate: "2026-01-15",
    referenceNumber: "12345",
    status: "confirmed",
    supplier: "Preventx",
    maxDeliveryDays: 5,
  };

  it("renders OrderStatusHeader component", () => {
    render(<OrderStatus order={mockOrder} />);
    expect(
      screen.getByRole("heading", { name: "HIV self-test" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/15 January 2026/i)).toBeInTheDocument();
  });

  it("renders OrderStatusContent component", () => {
    render(<OrderStatus order={mockOrder} />);
    expect(
      screen.getByText(/wait for your kit to be dispatched/i),
    ).toBeInTheDocument();
  });

  it("renders both header and content for dispatched status", () => {
    const dispatchedOrder: IOrderDetails = {
      ...mockOrder,
      status: "dispatched",
      dispatchedDate: "2026-01-20",
    };
    render(<OrderStatus order={dispatchedOrder} />);

    // Header content
    expect(
      screen.getByRole("heading", { name: "HIV self-test" }),
    ).toBeInTheDocument();

    // Status content
    expect(
      screen.getByText(/wait for your kit to arrive/i),
    ).toBeInTheDocument();
  });

  it("renders both header and content for received status", () => {
    const receivedOrder: IOrderDetails = {
      ...mockOrder,
      status: "received",
    };
    render(<OrderStatus order={receivedOrder} />);

    // Header content
    expect(
      screen.getByRole("heading", { name: "HIV self-test" }),
    ).toBeInTheDocument();

    // Status content
    expect(screen.getByText(/wait for your result/i)).toBeInTheDocument();
  });

  it("renders both header and content for ready status", () => {
    const readyOrder: IOrderDetails = {
      ...mockOrder,
      status: "ready",
    };
    render(<OrderStatus order={readyOrder} />);

    // Header content
    expect(
      screen.getByRole("heading", { name: "HIV self-test" }),
    ).toBeInTheDocument();

    // Status content
    expect(screen.getByText(/your result is ready/i)).toBeInTheDocument();
  });
});
