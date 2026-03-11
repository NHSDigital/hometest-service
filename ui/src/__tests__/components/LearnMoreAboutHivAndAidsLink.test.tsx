import { render, screen } from "@testing-library/react";

import { LearnMoreAboutHivAndAidsLink } from "@/components/LearnMoreAboutHivAndAidsLink";

describe("LearnMoreAboutHivAndAidsLink", () => {
  it("renders the HIV information link text", () => {
    render(<LearnMoreAboutHivAndAidsLink />);

    expect(
      screen.getByRole("link", { name: /learn more about hiv and aids/i }),
    ).toBeInTheDocument();
  });

  it("uses configured href and opens in a new tab", () => {
    render(<LearnMoreAboutHivAndAidsLink />);

    const link = screen.getByRole("link", { name: /learn more about hiv and aids/i });

    expect(link).toHaveAttribute("href", "https://www.nhs.uk/conditions/hiv-and-aids/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer noopener");
  });
});
