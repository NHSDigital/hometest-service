import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { AboutService } from "@/components/AboutService";

describe("AboutService", () => {
  it('renders the "About this service" heading', () => {
    render(
      <MemoryRouter>
        <AboutService supplier="Preventx" />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /about this service/i })).toBeInTheDocument();
  });

  it("renders HomeTest terms of use link with correct href and aria-label", () => {
    render(
      <MemoryRouter>
        <AboutService supplier="Preventx" />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: "HomeTest terms of use" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/home-test-terms-of-use");
  });

  it("renders HomeTest privacy policy link with correct href and aria-label", () => {
    render(
      <MemoryRouter>
        <AboutService supplier="Preventx" />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: "HomeTest privacy policy" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/home-test-privacy-policy");
  });

  it("renders supplier terms link with Preventx name", () => {
    render(
      <MemoryRouter>
        <AboutService supplier="Preventx" />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: "Preventx terms of use" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/suppliers-terms-conditions?supplier=Preventx");
  });

  it("renders supplier privacy link with Preventx name", () => {
    render(
      <MemoryRouter>
        <AboutService supplier="Preventx" />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: "Preventx privacy policy" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/suppliers-privacy-policy?supplier=Preventx");
  });

  it("renders supplier terms link with SH24 name", () => {
    render(
      <MemoryRouter>
        <AboutService supplier="SH:24" />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: "SH:24 terms of use" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/suppliers-terms-conditions?supplier=SH%3A24");
  });

  it("renders supplier privacy link with SH24 name", () => {
    render(
      <MemoryRouter>
        <AboutService supplier="SH:24" />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: "SH:24 privacy policy" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/suppliers-privacy-policy?supplier=SH%3A24");
  });
});
