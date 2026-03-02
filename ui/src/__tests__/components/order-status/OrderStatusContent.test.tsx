import { OrderDetails, OrderStatus } from "@/lib/models/order-details";
import { render, screen } from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";
import { OrderStatusContent } from "@/components/order-status";

const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe("OrderStatusContent", () => {
  const baseOrder: OrderDetails = {
    id: "123",
    orderedDate: "2026-01-15",
    referenceNumber: "12345",
    status: OrderStatus.CONFIRMED,
    supplier: "Preventx",
    maxDeliveryDays: 5,
  };

  describe("Confirmed status", () => {
    it("renders confirmed status heading", () => {
      renderWithRouter(<OrderStatusContent order={baseOrder} />);
      expect(screen.getByText(/wait for your kit to be dispatched/i)).toBeInTheDocument();
    });

    it("displays expected delivery timeframe", () => {
      renderWithRouter(<OrderStatusContent order={baseOrder} />);
      expect(screen.getByText(/within 5 working days/i)).toBeInTheDocument();
    });

    it('displays "Still need help?" section', () => {
      renderWithRouter(<OrderStatusContent order={baseOrder} />);
      expect(screen.getByRole("heading", { name: /still need help/i })).toBeInTheDocument();
    });

    it("displays supplier contact link", () => {
      renderWithRouter(<OrderStatusContent order={baseOrder} />);
      expect(screen.getByText(/contact preventx, the kit supplier/i)).toBeInTheDocument();
    });

    it("displays all help links with correct URLs", () => {
      renderWithRouter(<OrderStatusContent order={baseOrder} />);

      const bloodSampleLink = screen.getByText(/blood sample step-by-step guide/i);
      expect(bloodSampleLink).toBeInTheDocument();
      expect(bloodSampleLink).toHaveAttribute("href", "/blood-sample-guide");

      const sexualHealthLink = screen.getByText(/contact my nearest sexual health clinic/i);
      expect(sexualHealthLink).toBeInTheDocument();
      expect(sexualHealthLink).toHaveAttribute(
        "href",
        "https://www.nhs.uk/service-search/sexual-health-services/find-a-sexual-health-clinic/?postcode=<POSTCODE>",
      );

      const hivInfoLink = screen.getByText(/learn more about hiv and aids/i);
      expect(hivInfoLink).toBeInTheDocument();
      expect(hivInfoLink).toHaveAttribute("href", "https://www.nhs.uk/conditions/hiv-and-aids/");
    });
  });

  describe("Dispatched status", () => {
    const dispatchedOrder: OrderDetails = {
      ...baseOrder,
      status: OrderStatus.DISPATCHED,
      dispatchedDate: "2026-01-16",
    };

    it("renders dispatched status heading", () => {
      renderWithRouter(<OrderStatusContent order={dispatchedOrder} />);
      expect(screen.getByText(/wait for your kit to arrive/i)).toBeInTheDocument();
    });

    it("displays dispatched date", () => {
      renderWithRouter(<OrderStatusContent order={dispatchedOrder} />);
      expect(screen.getByText(/16 January 2026/i)).toBeInTheDocument();
    });

    it("displays expected delivery timeframe", () => {
      renderWithRouter(<OrderStatusContent order={dispatchedOrder} />);
      expect(screen.getByText(/within 5 working days/i)).toBeInTheDocument();
    });

    it('displays "Still need help?" section', () => {
      renderWithRouter(<OrderStatusContent order={dispatchedOrder} />);
      expect(screen.getByRole("heading", { name: /still need help/i })).toBeInTheDocument();
    });

    it('does not display "Sent" text when dispatchedDate is not provided', () => {
      const orderWithoutDate: OrderDetails = {
        ...baseOrder,
        status: OrderStatus.DISPATCHED,
      };
      renderWithRouter(<OrderStatusContent order={orderWithoutDate} />);
      expect(screen.queryByText(/sent/i)).not.toBeInTheDocument();
    });
  });

  describe("Received status", () => {
    const receivedOrder: OrderDetails = {
      ...baseOrder,
      status: OrderStatus.RECEIVED,
    };

    it("renders received status heading", () => {
      renderWithRouter(<OrderStatusContent order={receivedOrder} />);
      expect(screen.getByText(/wait for your result/i)).toBeInTheDocument();
    });

    it("displays contact message", () => {
      renderWithRouter(<OrderStatusContent order={receivedOrder} />);
      expect(screen.getByText(/we.ll contact you when it.s ready/i)).toBeInTheDocument();
    });

    it('displays "More information" section', () => {
      renderWithRouter(<OrderStatusContent order={receivedOrder} />);
      expect(screen.getByRole("heading", { name: /more information/i })).toBeInTheDocument();
    });

    it("displays HIV info link with correct URL", () => {
      renderWithRouter(<OrderStatusContent order={receivedOrder} />);
      const hivInfoLink = screen.getByText(/learn more about hiv and aids/i);
      expect(hivInfoLink).toBeInTheDocument();
      expect(hivInfoLink).toHaveAttribute("href", "https://www.nhs.uk/conditions/hiv-and-aids/");
    });
  });

  describe("Complete status", () => {
    const readyOrder: OrderDetails = {
      ...baseOrder,
      status: OrderStatus.COMPLETE,
    };

    it("renders ready status heading", () => {
      renderWithRouter(<OrderStatusContent order={readyOrder} />);
      expect(screen.getByText(/your result is ready/i)).toBeInTheDocument();
    });

    it('displays "View your result" link', () => {
      renderWithRouter(<OrderStatusContent order={readyOrder} />);
      expect(screen.getByText(/view your result/i)).toBeInTheDocument();
    });
  });

  describe("Custom delivery days", () => {
    it("uses custom maxDeliveryDays when provided", () => {
      const customOrder = { ...baseOrder, maxDeliveryDays: 7 };
      renderWithRouter(<OrderStatusContent order={customOrder} />);
      expect(screen.getByText(/within 7 working days/i)).toBeInTheDocument();
    });
  });
});
