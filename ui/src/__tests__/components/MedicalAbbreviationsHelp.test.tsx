import { render, screen } from "@testing-library/react";

import { MedicalAbbreviationsHelp } from "@/components/test-results/MedicalAbbreviationsHelp";

describe("MedicalAbbreviationsHelp", () => {
  it("renders explanatory text and help link", () => {
    render(<MedicalAbbreviationsHelp />);

    expect(
      screen.getByText(
        "You may see medical abbreviations you are not familiar with.",
      ),
    ).toBeInTheDocument();

    const link = screen.getByRole("link", {
      name: /help with medical abbreviations/i,
    });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://www.nhs.uk/nhs-app/help/health-records-in-the-nhs-app/abbreviations-commonly-found-in-medical-records/",
    );
  });
});
