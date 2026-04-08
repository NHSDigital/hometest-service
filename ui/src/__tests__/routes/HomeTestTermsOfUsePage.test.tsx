import "@testing-library/jest-dom";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import HomeTestTermsOfUsePage from "@/routes/HomeTestTermsOfUsePage";

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/home-test-terms-of-use"]}>{children}</MemoryRouter>
);

describe("HomeTestTermsOfUsePage", () => {
  beforeEach(() => {
    render(<HomeTestTermsOfUsePage />, { wrapper: TestWrapper });
  });

  afterEach(() => {
    cleanup();
  });

  describe("Component Rendering", () => {
    it("renders the main heading from content config", () => {
      const heading = screen.getByRole("heading", {
        name: /Hometest Terms of Use/i,
        level: 1,
      });
      expect(heading).toBeInTheDocument();
    });

    it("renders the Back link", () => {
      const backLink = screen.getByText(/^back$/i, { selector: ".nhsuk-back-link" });
      expect(backLink).toBeInTheDocument();
    });

    it("renders the introduction paragraph from content config", () => {
      expect(screen.getByText(/\[Hometest\] is operated by NHS England/i)).toBeInTheDocument();
    });

    it("renders all main section headings", () => {
      expect(screen.getByRole("heading", { name: /1\. Introduction/i })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /2\. When these terms apply/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          name: /3\. Availability of Testing Services/i,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /4\. Accessing the Hometest App/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          name: /5\. Updates to the Hometest and NHS Apps/i,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /6\. Details about the Services/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /7\. Using the services/i })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          name: /8\. Ending your use of the Hometest App/i,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          name: /9\. Your right to use the Hometest App/i,
        }),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /10\. Prohibited uses/i })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /11\. Our liability to you/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /12\. General/i })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /13\. Changes to these Terms of Use/i }),
      ).toBeInTheDocument();
    });

    it("renders Testing Services and Hometest App Services as list items in section 6", () => {
      expect(screen.getAllByText(/Testing Services/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Hometest App Services/i).length).toBeGreaterThan(0);
    });
  });

  describe("AC3: External Links Open in New Tab", () => {
    it("renders the help and support URL as a clickable link", () => {
      const helpLinks = screen.getAllByRole("link", {
        name: /help and support page/i,
      });

      expect(helpLinks.length).toBeGreaterThan(0);
      expect(helpLinks[0]).toHaveAttribute("href", "https://www.nhs.uk/nhs-app/help/");
    });

    it("adds target='_blank' to the external help and support link", () => {
      const helpLinks = screen.getAllByRole("link", {
        name: /help and support page/i,
      });

      expect(helpLinks[0]).toHaveAttribute("target", "_blank");
    });

    it("adds rel='noopener noreferrer' to the external help and support link", () => {
      const helpLinks = screen.getAllByRole("link", {
        name: /help and support page/i,
      });

      expect(helpLinks[0]).toHaveAttribute("rel", expect.stringContaining("noopener"));
      expect(helpLinks[0]).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
    });

    it("adds aria-label with '(opens in new tab)' for accessibility", () => {
      const helpLinks = screen.getAllByRole("link", {
        name: /help and support page.*opens in new tab/i,
      });

      expect(helpLinks.length).toBeGreaterThan(0);
    });

    it("applies correct NHS link styling class to external links", () => {
      const helpLinks = screen.getAllByRole("link", {
        name: /help and support page/i,
      });

      expect(helpLinks[0]).toHaveClass("nhsuk-link");
    });
  });

  describe("Internal Links", () => {
    it("renders Hometest Privacy Policy as an internal link with display text", () => {
      const privacyLinks = screen.getAllByRole("link", {
        name: /Hometest Privacy Policy/i,
      });

      expect(privacyLinks.length).toBeGreaterThan(0);
      expect(privacyLinks[0]).toHaveAttribute("href", "/home-test-privacy-policy");
    });

    it("does not add target='_blank' to internal privacy policy links", () => {
      const privacyLinks = screen.getAllByRole("link", {
        name: /Hometest Privacy Policy/i,
      });

      expect(privacyLinks[0]).not.toHaveAttribute("target", "_blank");
    });

    it("applies nhsuk-link class to internal links", () => {
      const privacyLinks = screen.getAllByRole("link", {
        name: /Hometest Privacy Policy/i,
      });

      expect(privacyLinks[0]).toHaveClass("nhsuk-link");
    });
  });

  describe("Accessibility", () => {
    it("applies aria-labelledby to all sections", () => {
      const sections = screen.getAllByRole("region");
      sections.forEach((section) => {
        expect(section).toHaveAttribute("aria-labelledby");
      });
    });

    it("uses semantic heading hierarchy", () => {
      expect(
        screen.getByRole("heading", {
          name: /Hometest Terms of Use/i,
          level: 1,
        }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole("heading", { name: /1\. Introduction/i, level: 2 }),
      ).toBeInTheDocument();

      // Testing Services is rendered as a bold list item, not an h3
      expect(screen.getAllByText(/Testing Services/i).length).toBeGreaterThan(0);
    });
  });

  describe("Styling", () => {
    it("applies correct NHS heading class to main title", () => {
      const heading = screen.getByRole("heading", {
        name: /Hometest Terms of Use/i,
        level: 1,
      });

      expect(heading).toHaveClass("nhsuk-heading-l");
    });

    it("applies NHS body class to paragraphs", () => {
      const introText = screen.getByText(/is operated by NHS England/i);
      expect(introText.closest("p")).toHaveClass("nhsuk-body");
    });

    it("applies nhsuk-list--bullet class to bullet lists", () => {
      const lists = document.querySelectorAll(".nhsuk-list--bullet");
      expect(lists.length).toBeGreaterThan(0);
    });
  });
});
