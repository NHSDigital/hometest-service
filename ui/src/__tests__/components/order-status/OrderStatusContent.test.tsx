import { render, screen } from "@testing-library/react";

import { Order } from "@/types/order";
import { OrderStatusContent } from "@/components/order-status";

describe("OrderStatusContent", () => {
  const baseOrder: Order = {
    id: "123",
    testType: "HIV self-test",
    orderedDate: "2026-01-15",
    referenceNumber: "12345",
    status: "confirmed",
    supplier: "Preventx",
    maxDeliveryDays: 5,
  };

  describe("Confirmed status", () => {
    it("renders confirmed status heading", () => {
      render(<OrderStatusContent order={baseOrder} />);
      expect(
        screen.getByText(/wait for your kit to be dispatched/i),
      ).toBeInTheDocument();
    });

    it("displays expected delivery timeframe", () => {
      render(<OrderStatusContent order={baseOrder} />);
      expect(screen.getByText(/within 5 working days/i)).toBeInTheDocument();
    });

    it('displays "Still need help?" section', () => {
      render(<OrderStatusContent order={baseOrder} />);
      expect(
        screen.getByRole("heading", { name: /still need help/i }),
      ).toBeInTheDocument();
    });

    it("displays supplier contact link", () => {
      render(<OrderStatusContent order={baseOrder} />);
      expect(
        screen.getByText(/contact preventx, the kit supplier/i),
      ).toBeInTheDocument();
    });

    it("displays all help links with correct URLs", () => {
      render(<OrderStatusContent order={baseOrder} />);

      const bloodSampleLink = screen.getByText(
        /blood sample step-by-step guide/i,
      );
      expect(bloodSampleLink).toBeInTheDocument();
      expect(bloodSampleLink).toHaveAttribute("href", "/blood-sample-guide");

      const sexualHealthLink = screen.getByText(
        /contact my nearest sexual health clinic/i,
      );
      expect(sexualHealthLink).toBeInTheDocument();
      expect(sexualHealthLink).toHaveAttribute(
        "href",
        "https://www.nhs.uk/service-search/sexual-health-services/find-a-sexual-health-clinic/?postcode=<POSTCODE>",
      );

      const hivInfoLink = screen.getByText(/learn more about hiv and aids/i);
      expect(hivInfoLink).toBeInTheDocument();
      expect(hivInfoLink).toHaveAttribute(
        "href",
        "https://www.nhs.uk/conditions/hiv-and-aids/",
      );
    });
  });

  describe("Dispatched status", () => {
    const dispatchedOrder: Order = {
      ...baseOrder,
      status: "dispatched",
      dispatchedDate: "2026-01-16",
    };

    it("renders dispatched status heading", () => {
      render(<OrderStatusContent order={dispatchedOrder} />);
      expect(
        screen.getByText(/wait for your kit to arrive/i),
      ).toBeInTheDocument();
    });

    it("displays dispatched date", () => {
      render(<OrderStatusContent order={dispatchedOrder} />);
      expect(screen.getByText(/16 January 2026/i)).toBeInTheDocument();
    });

    it("displays expected delivery timeframe", () => {
      render(<OrderStatusContent order={dispatchedOrder} />);
      expect(screen.getByText(/within 5 working days/i)).toBeInTheDocument();
    });

    it('displays "Still need help?" section', () => {
      render(<OrderStatusContent order={dispatchedOrder} />);
      expect(
        screen.getByRole("heading", { name: /still need help/i }),
      ).toBeInTheDocument();
    });

    it('does not display "Sent" text when dispatchedDate is not provided', () => {
      const orderWithoutDate: Order = {
        ...baseOrder,
        status: "dispatched",
      };
      render(<OrderStatusContent order={orderWithoutDate} />);
      expect(screen.queryByText(/sent/i)).not.toBeInTheDocument();
    });
  });

  describe("Received status", () => {
    const receivedOrder: Order = {
      ...baseOrder,
      status: "received",
    };

    it("renders received status heading", () => {
      render(<OrderStatusContent order={receivedOrder} />);
      expect(screen.getByText(/wait for your result/i)).toBeInTheDocument();
    });

    it("displays contact message", () => {
      render(<OrderStatusContent order={receivedOrder} />);
      expect(
        screen.getByText(/we.ll contact you when it.s ready/i),
      ).toBeInTheDocument();
    });

    it('displays "More information" section', () => {
      render(<OrderStatusContent order={receivedOrder} />);
      expect(
        screen.getByRole("heading", { name: /more information/i }),
      ).toBeInTheDocument();
    });

    it("displays HIV info link with correct URL", () => {
      render(<OrderStatusContent order={receivedOrder} />);
      const hivInfoLink = screen.getByText(/learn more about hiv and aids/i);
      expect(hivInfoLink).toBeInTheDocument();
      expect(hivInfoLink).toHaveAttribute(
        "href",
        "https://www.nhs.uk/conditions/hiv-and-aids/",
      );
    });
  });

  describe("Ready status", () => {
    const readyOrder: Order = {
      ...baseOrder,
      status: "ready",
    };

    it("renders ready status heading", () => {
      render(<OrderStatusContent order={readyOrder} />);
      expect(screen.getByText(/your result is ready/i)).toBeInTheDocument();
    });

    it('displays "View your result" link', () => {
      render(<OrderStatusContent order={readyOrder} />);
      expect(screen.getByText(/view your result/i)).toBeInTheDocument();
    });

    it('displays "More information" section', () => {
      render(<OrderStatusContent order={readyOrder} />);
      expect(
        screen.getByRole("heading", { name: /more information/i }),
      ).toBeInTheDocument();
    });

    it("displays HIV info link with correct URL", () => {
      render(<OrderStatusContent order={readyOrder} />);
      const hivInfoLink = screen.getByText(/learn more about hiv and aids/i);
      expect(hivInfoLink).toBeInTheDocument();
      expect(hivInfoLink).toHaveAttribute(
        "href",
        "https://www.nhs.uk/conditions/hiv-and-aids/",
      );
    });
  });

  describe("Custom delivery days", () => {
    it("uses custom maxDeliveryDays when provided", () => {
      const customOrder = { ...baseOrder, maxDeliveryDays: 7 };
      render(<OrderStatusContent order={customOrder} />);
      expect(screen.getByText(/within 7 working days/i)).toBeInTheDocument();
    });
  });
});
