import { render, screen } from "@testing-library/react";

import { FindAnotherSexualHealthClinicLink } from "@/components/FindAnotherSexualHealthClinicLink";

describe("FindAnotherSexualHealthClinicLink", () => {
  it("renders base clinic search link when postcode is not provided", () => {
    render(<FindAnotherSexualHealthClinicLink />);

    const link = screen.getByRole("link", {
      name: /find another sexual health clinic/i,
    });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://www.nhs.uk/service-search/sexual-health-services/find-a-sexual-health-clinic",
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("appends encoded postcode to results URL when postcode is provided", () => {
    render(<FindAnotherSexualHealthClinicLink postcodeSearch="SW1A 1AA" />);

    const link = screen.getByRole("link", {
      name: /find another sexual health clinic/i,
    });

    expect(link).toHaveAttribute(
      "href",
      "https://www.nhs.uk/service-search/sexual-health-services/find-a-sexual-health-clinic/results?location=SW1A%201AA",
    );
  });
});
