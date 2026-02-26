import { render, screen } from "@testing-library/react";

import { MoreOptionsAndInformation } from "@/components/test-results/MoreOptionsAndInformation";

describe("MoreOptionsAndInformation", () => {
  it("renders heading and supplier-specific text", () => {
    render(<MoreOptionsAndInformation supplier="Preventx" />);

    expect(
      screen.getByRole("heading", { name: "More options and information" }),
    ).toBeInTheDocument();
    const questionnaireLink = screen.getByRole("link", {
      name: /complete an online sexual health questionnaire with preventx/i,
    });
    expect(questionnaireLink).toBeInTheDocument();
    expect(questionnaireLink).toHaveAttribute("href", "#");
  });

  it("renders learn more link", () => {
    render(<MoreOptionsAndInformation supplier="Preventx" />);

    const hivLink = screen.getByRole("link", {
      name: /learn more about hiv and aids/i,
    });

    expect(hivLink).toBeInTheDocument();
    expect(hivLink).toHaveAttribute(
      "href",
      "https://www.nhs.uk/conditions/hiv-and-aids/",
    );
  });
});
