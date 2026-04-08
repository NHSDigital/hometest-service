import "@testing-library/jest-dom";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import HomeTestPrivacyPolicyPage from "@/routes/HomeTestPrivacyPolicyPage";

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/home-test-privacy-policy"]}>{children}</MemoryRouter>
);

describe("HomeTestPrivacyPolicyPage", () => {
  beforeEach(() => {
    render(<HomeTestPrivacyPolicyPage />, { wrapper: TestWrapper });
  });

  afterEach(() => {
    cleanup();
  });

  describe("Component Rendering", () => {
    it("renders the main heading from content config", () => {
      const heading = screen.getByRole("heading", {
        name: /Hometest Privacy Policy/i,
        level: 1,
      });
      expect(heading).toBeInTheDocument();
    });

    it("renders introduction paragraphs from content config", () => {
      expect(
        screen.getAllByText(
          (_content, element) =>
            (element?.textContent ?? "").match(/\[Hometest\] is operated by NHS England/i) !== null,
        ).length,
      ).toBeGreaterThan(0);
      expect(screen.getAllByText(/is operated by NHS England/i).length).toBeGreaterThan(0);
      expect(
        screen.getByText(/This privacy policy provides an explanation as to what happens/i),
      ).toBeInTheDocument();
    });

    it("renders all main section headings", () => {
      expect(screen.getByRole("heading", { name: /Introduction/i })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          name: /Information About NHS England and its Partners/i,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /The Purposes of Processing/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /Lawful Basis for Processing/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /What Data We Collect/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Your Rights/i })).toBeInTheDocument();
    });
  });

  describe("AC3: Links Open in New Tab", () => {
    it("converts URLs in text to clickable links", () => {
      const icoLink = screen.getByRole("link", {
        name: /https:\/\/ico.org.uk\/make-a-complaint\//i,
      });

      expect(icoLink).toBeInTheDocument();
      expect(icoLink).toHaveAttribute("href", "https://ico.org.uk/make-a-complaint/");
    });

    it("adds target='_blank' to external links", () => {
      const icoLink = screen.getByRole("link", {
        name: /https:\/\/ico.org.uk\/make-a-complaint\//i,
      });

      expect(icoLink).toHaveAttribute("target", "_blank");
    });

    it("adds aria-label with '(opens in new tab)' for accessibility", () => {
      const icoLink = screen.getByRole("link", {
        name: /https:\/\/ico.org.uk\/make-a-complaint\/.*opens in new tab/i,
      });

      expect(icoLink).toBeInTheDocument();
    });

    it("applies correct NHS link styling class", () => {
      const icoLink = screen.getByRole("link", {
        name: /https:\/\/ico.org.uk\/make-a-complaint\//i,
      });

      expect(icoLink).toHaveClass("nhsuk-link");
    });
  });

  describe("Accessibility", () => {
    it("applies aria-labelledby to sections", () => {
      const sections = screen.getAllByRole("region");
      sections.forEach((section) => {
        expect(section).toHaveAttribute("aria-labelledby");
      });
    });

    it("uses semantic heading hierarchy", () => {
      // h1 for main title
      expect(
        screen.getByRole("heading", { name: /Hometest Privacy Policy/i, level: 1 }),
      ).toBeInTheDocument();

      // h2 for section headings
      expect(screen.getByRole("heading", { name: /Introduction/i, level: 2 })).toBeInTheDocument();

      // inline subsection headings render as bold text in paragraphs
      expect(
        screen.getByRole("heading", {
          name: /Hometest App Services/i,
          level: 3,
        }),
      ).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies correct NHS heading class to main title", () => {
      const heading = screen.getByRole("heading", {
        name: /Hometest Privacy Policy/i,
        level: 1,
      });

      expect(heading).toHaveClass("nhsuk-heading-l");
    });

    it("applies NHS body class to paragraphs", () => {
      const paragraphs = screen.getAllByText(/is operated by NHS England/i);
      expect(paragraphs[0].closest("p")).toHaveClass("nhsuk-body");
    });
  });
});
