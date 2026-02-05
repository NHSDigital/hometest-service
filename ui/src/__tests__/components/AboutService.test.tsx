import { render, screen } from "@testing-library/react";

import { AboutService } from "@/components/AboutService";

describe("AboutService", () => {
  it('renders the "About this service" heading', () => {
    render(<AboutService supplier="Preventx" />);
    expect(
      screen.getByRole("heading", { name: /about this service/i }),
    ).toBeInTheDocument();
  });

  it("renders HomeTest terms of use link with correct href and aria-label", () => {
    render(<AboutService supplier="Preventx" />);
    const link = screen.getByRole("link", { name: "HomeTest terms of use" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/home-test-terms-of-use");
  });

  it("renders HomeTest privacy policy link with correct href and aria-label", () => {
    render(<AboutService supplier="Preventx" />);
    const link = screen.getByRole("link", { name: "HomeTest privacy policy" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/home-test-privacy-policy");
  });

  it("renders supplier terms link with Preventx name", () => {
    render(<AboutService supplier="Preventx" />);
    const link = screen.getByRole("link", { name: "Preventx terms of use" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/suppliers-terms-conditions");
  });

  it("renders supplier privacy link with Preventx name", () => {
    render(<AboutService supplier="Preventx" />);
    const link = screen.getByRole("link", { name: "Preventx privacy policy" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/suppliers-privacy-policy");
  });

  it("renders supplier terms link with SH24 name", () => {
    render(<AboutService supplier="SH24" />);
    const link = screen.getByRole("link", { name: "SH24 terms of use" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/suppliers-terms-conditions");
  });

  it("renders supplier privacy link with SH24 name", () => {
    render(<AboutService supplier="SH24" />);
    const link = screen.getByRole("link", { name: "SH24 privacy policy" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/suppliers-privacy-policy");
  });
});
