import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PrivacyPolicyPage from "@/routes/PrivacyPolicyPage";

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/home-test-privacy-policy"]}>
    {children}
  </MemoryRouter>
);

describe("PrivacyPolicyPage", () => {
  describe("Component Rendering", () => {
    it("renders the main heading from content config", () => {
      render(<PrivacyPolicyPage />, { wrapper: TestWrapper });

      const heading = screen.getByRole("heading", {
        name: "Privacy Policy",
        level: 1,
      });
      expect(heading).toBeInTheDocument();
    });

    it("renders the Back link", () => {
      render(<PrivacyPolicyPage />, { wrapper: TestWrapper });

      const backLink = screen.getByRole("link", { name: /back/i });
      expect(backLink).toBeInTheDocument();
    });

    it("renders introduction paragraphs from content config", () => {
      render(<PrivacyPolicyPage />, { wrapper: TestWrapper });

      expect(
        screen.getByText(/\[Hometest\] is operated by NHS England/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /This privacy policy provides an explanation as to what happens/i
        )
      ).toBeInTheDocument();
    });

    it("renders all main section headings", () => {
      render(<PrivacyPolicyPage />, { wrapper: TestWrapper });

      expect(
        screen.getByRole("heading", { name: /Introduction/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          name: /Information About NHS England and its Partners/i,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /The Purposes of Processing/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /Lawful Basis for Processing/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /What Data We Collect/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /Your Rights/i })
      ).toBeInTheDocument();
    });
  });

  describe("AC3: Links Open in New Tab", () => {
    it("converts URLs in text to clickable links", () => {
      render(<PrivacyPolicyPage />, { wrapper: TestWrapper });

      const icoLink = screen.getByRole("link", {
        name: /https:\/\/ico.org.uk\/make-a-complaint\//i,
      });

      expect(icoLink).toBeInTheDocument();
      expect(icoLink).toHaveAttribute(
        "href",
        "https://ico.org.uk/make-a-complaint/"
      );
    });

    it("adds target='_blank' to external links", () => {
      render(<PrivacyPolicyPage />, { wrapper: TestWrapper });

      const icoLink = screen.getByRole("link", {
        name: /https:\/\/ico.org.uk\/make-a-complaint\//i,
      });

      expect(icoLink).toHaveAttribute("target", "_blank");
    });

    it("adds aria-label with '(opens in new tab)' for accessibility", () => {
      render(<PrivacyPolicyPage />, { wrapper: TestWrapper });

      const icoLink = screen.getByRole("link", {
        name: /https:\/\/ico.org.uk\/make-a-complaint\/.*opens in new tab/i,
      });

      expect(icoLink).toBeInTheDocument();
    });

    it("applies correct NHS link styling class", () => {
      render(<PrivacyPolicyPage />, { wrapper: TestWrapper });

      const icoLink = screen.getByRole("link", {
        name: /https:\/\/ico.org.uk\/make-a-complaint\//i,
      });

      expect(icoLink).toHaveClass("nhsuk-link");
    });
  });

  describe("Accessibility", () => {
    it("applies aria-labelledby to sections", () => {
      render(<PrivacyPolicyPage />, { wrapper: TestWrapper });

      const sections = screen.getAllByRole("region");
      sections.forEach((section) => {
        expect(section).toHaveAttribute("aria-labelledby");
      });
    });

    it("uses semantic heading hierarchy", () => {
      render(<PrivacyPolicyPage />, { wrapper: TestWrapper });

      // h1 for main title
      expect(
        screen.getByRole("heading", { name: /Privacy Policy/i, level: 1 })
      ).toBeInTheDocument();

      // h2 for section headings
      expect(
        screen.getByRole("heading", { name: /Introduction/i, level: 2 })
      ).toBeInTheDocument();

      // h3 for subsection headings
      expect(
        screen.getByRole("heading", {
          name: /Hometest App Services/i,
          level: 3,
        })
      ).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies correct NHS heading class to main title", () => {
      render(<PrivacyPolicyPage />, { wrapper: TestWrapper });

      const heading = screen.getByRole("heading", {
        name: /Privacy Policy/i,
        level: 1,
      });

      expect(heading).toHaveClass("nhsuk-heading-l");
    });

    it("applies NHS body class to paragraphs", () => {
      render(<PrivacyPolicyPage />, { wrapper: TestWrapper });

      const paragraphs = screen.getAllByText(/is operated by NHS England/i);
      expect(paragraphs[0].closest("p")).toHaveClass("nhsuk-body");
    });
  });
});
