import { render, screen } from "@testing-library/react";

import { IOrderDetails } from "@/lib/models/order-details";
import { OrderStatusHeader } from "@/components/order-status";

describe("OrderStatusHeader", () => {
  const mockOrder: IOrderDetails = {
    id: "123",
    orderedDate: "2026-01-15",
    referenceNumber: "12345",
    status: "confirmed",
    supplier: "Preventx",
    maxDeliveryDays: 5,
  };

  it("renders the test type as heading", () => {
    render(<OrderStatusHeader order={mockOrder} />);
    const heading = screen.getByRole("heading", { name: "HIV self-test" });
    expect(heading).toBeInTheDocument();
  });

  it("displays the ordered date in correct format", () => {
    render(<OrderStatusHeader order={mockOrder} />);
    expect(screen.getByText(/15 January 2026/i)).toBeInTheDocument();
  });

  it("displays the reference number", () => {
    render(<OrderStatusHeader order={mockOrder} />);
    expect(screen.getByText(/12345/i)).toBeInTheDocument();
  });

  it("formats the date correctly", () => {
    const order = { ...mockOrder, orderedDate: "2025-05-04" };
    render(<OrderStatusHeader order={order} />);
    expect(screen.getByText(/4 May 2025/i)).toBeInTheDocument();
  });
});
