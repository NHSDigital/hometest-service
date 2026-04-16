import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { OrderStatus } from "@/components/order-status";
import { OrderDetails, OrderStatus as OrderStatusEnum } from "@/lib/models/order-details";

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

  describe("renders both header and content for each status", () => {
    it.each<[OrderStatusEnum, string | RegExp, OrderDetails["dispatchedDate"]]>([
      [OrderStatusEnum.GENERATED, /PROCESSING/i, undefined],
      [OrderStatusEnum.QUEUED, /PROCESSING/i, undefined],
      [OrderStatusEnum.SUBMITTED, /wait for your kit to be dispatched/i, undefined],
      [OrderStatusEnum.CONFIRMED, /wait for your kit to be dispatched/i, undefined],
      [OrderStatusEnum.DISPATCHED, /wait for your kit to arrive/i, "2026-01-20"],
      [OrderStatusEnum.RECEIVED, /wait for your result/i, undefined],
      [OrderStatusEnum.COMPLETE, /your result is ready/i, undefined],
    ])("%s status", (status, expectedContent, dispatchedDate) => {
      const order: OrderDetails = {
        ...mockOrder,
        status,
        dispatchedDate,
      };
      renderWithRouter(<OrderStatus order={order} />);

      expect(screen.getByRole("heading", { name: "HIV self-test" })).toBeInTheDocument();
      expect(screen.getByText(/15 January 2026/i)).toBeInTheDocument();
      expect(screen.getByText(expectedContent)).toBeInTheDocument();

      if (dispatchedDate) {
        expect(screen.getByText(/20 January 2026/i)).toBeInTheDocument();
      }
    });
  });
});
