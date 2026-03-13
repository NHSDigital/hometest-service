import { OrderDetails, OrderStatus } from "@/lib/models/order-details";
import { render, screen } from "@testing-library/react";

import { OrderStatusHeader } from "@/components/order-status";

describe("OrderStatusHeader", () => {
  const mockOrder: OrderDetails = {
    id: "123",
    orderedDate: "2026-01-15",
    referenceNumber: "12345",
    status: OrderStatus.CONFIRMED,
    supplier: "Preventx",
    maxDeliveryDays: 5,
  };

  it("renders the test type as heading", () => {
    render(<OrderStatusHeader order={mockOrder} heading="HIV self-test" />);
    const heading = screen.getByRole("heading", { name: "HIV self-test" });
    expect(heading).toBeInTheDocument();
  });

  it("renders custom heading when provided", () => {
    render(<OrderStatusHeader order={mockOrder} heading="HIV self-test result" />);
    const heading = screen.getByRole("heading", {
      name: "HIV self-test result",
    });
    expect(heading).toBeInTheDocument();
  });

  it("displays the ordered date in correct format", () => {
    render(<OrderStatusHeader order={mockOrder} heading="HIV self-test" />);
    expect(screen.getByText(/15 January 2026/i)).toBeInTheDocument();
  });

  it("displays the reference number", () => {
    render(<OrderStatusHeader order={mockOrder} heading="HIV self-test" />);
    expect(screen.getByText(/12345/i)).toBeInTheDocument();
  });

  it("formats the date correctly", () => {
    const order = { ...mockOrder, orderedDate: "2025-05-04" };
    render(<OrderStatusHeader order={order} heading="HIV self-test" />);
    expect(screen.getByText(/4 May 2025/i)).toBeInTheDocument();
  });
});
