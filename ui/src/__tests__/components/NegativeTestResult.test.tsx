import { OrderDetails, OrderStatus } from "@/lib/models/order-details";
import { render, screen } from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";
import { NegativeTestResult } from "@/components/test-results/NegativeTestResult";

const mockOrder: OrderDetails = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  orderedDate: "2026-01-15",
  referenceNumber: "12345",
  status: OrderStatus.COMPLETE,
  supplier: "Preventx",
  maxDeliveryDays: 5,
};

describe("NegativeTestResult", () => {
  it("renders negative result sections", () => {
    render(
      <MemoryRouter>
        <NegativeTestResult order={mockOrder} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "HIV self-test result" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Your result")).toBeInTheDocument();
    expect(screen.getByText("Negative")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Next steps" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "More options and information" }),
    ).toBeInTheDocument();
  });

  it("renders supplier name in contextual copy", () => {
    render(
      <MemoryRouter>
        <NegativeTestResult order={mockOrder} />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/If you have any questions about your result,/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /contact preventx, the kit supplier/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /complete an online sexual health questionnaire with preventx/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders help and information links", () => {
    render(
      <MemoryRouter>
        <NegativeTestResult order={mockOrder} />
      </MemoryRouter>,
    );

    const hivLink = screen.getByRole("link", {
      name: /learn more about hiv and aids/i,
    });
    expect(hivLink).toBeInTheDocument();
    expect(hivLink).toHaveAttribute(
      "href",
      "https://www.nhs.uk/conditions/hiv-and-aids/",
    );

    const abbreviationsLink = screen.getByRole("link", {
      name: /help with medical abbreviations/i,
    });
    expect(abbreviationsLink).toBeInTheDocument();
    expect(abbreviationsLink).toHaveAttribute(
      "href",
      "https://www.nhs.uk/nhs-app/help/health-records-in-the-nhs-app/abbreviations-commonly-found-in-medical-records/",
    );
  });
});
