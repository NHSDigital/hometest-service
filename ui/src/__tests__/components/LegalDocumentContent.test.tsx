import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { LegalDocumentContent } from "@/components/LegalDocumentContent";
import { type LegalDocumentContent as LegalDocumentContentType } from "@/content/schema";

const content: LegalDocumentContentType = {
  title: "Home Test Privacy Policy",
  introduction: ["Welcome to Home Test", "Read our policy at https://example.org/policy"],
  sections: [
    {
      id: "section-1",
      heading: "How we use your data",
      paragraphs: ["We only use your data for service delivery."],
      subsections: [
        {
          heading: "Why we process data",
          paragraphs: ["To send and process your test kit."],
          list: ["Order processing", "More details at https://example.org/details"],
        },
      ],
    },
    {
      id: "section-2",
      heading: "Contact",
      paragraphs: ["Contact support for help."],
    },
  ],
};

describe("LegalDocumentContent", () => {
  it("renders title, introduction and sections", () => {
    render(<LegalDocumentContent content={content} />);

    expect(screen.getByRole("heading", { level: 1, name: content.title })).toBeInTheDocument();
    expect(screen.getByText("Welcome to Home Test")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "How we use your data" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Contact" })).toBeInTheDocument();
    expect(screen.getByText("We only use your data for service delivery.")).toBeInTheDocument();
    expect(screen.getByText("Contact support for help.")).toBeInTheDocument();
  });

  it("renders subsection heading, paragraphs and bullet list", () => {
    render(<LegalDocumentContent content={content} />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Why we process data" }),
    ).toBeInTheDocument();
    expect(screen.getByText("To send and process your test kit.")).toBeInTheDocument();
    expect(screen.getByText("Order processing")).toBeInTheDocument();
  });

  it("renders URL text as external links", () => {
    render(<LegalDocumentContent content={content} />);

    const introLink = screen.getByRole("link", {
      name: /https:\/\/example\.org\/policy/i,
    });
    const listLink = screen.getByRole("link", {
      name: /https:\/\/example\.org\/details/i,
    });

    expect(introLink).toHaveAttribute("href", "https://example.org/policy");
    expect(introLink).toHaveAttribute("target", "_blank");
    expect(listLink).toHaveAttribute("href", "https://example.org/details");
  });
});
