import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { SuppliersPrivacyPolicyContent } from "@/components/SuppliersPrivacyPolicyContent";

const mockUsePageContent = jest.fn();

jest.mock("@/hooks", () => ({
  usePageContent: () => mockUsePageContent(),
}));

describe("SuppliersPrivacyPolicyContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePageContent.mockReturnValue({
      suppliers: {
        preventx: {
          title: "Preventx privacy policy",
          introduction: ["Welcome text", "Read https://example.org/info"],
          sections: [
            {
              id: "privacy",
              heading: "Privacy",
              paragraphs: ["Privacy paragraph"],
              subsections: [
                {
                  heading: "How data is used",
                  paragraphs: ["Data usage paragraph"],
                  list: ["Item one", "Link item https://example.org/list"],
                },
              ],
            },
          ],
        },
      },
    });
  });

  it("renders supplier content when supplier exists", () => {
    render(<SuppliersPrivacyPolicyContent supplier="preventx" />);

    expect(screen.getByRole("heading", { name: "Preventx privacy policy" })).toBeInTheDocument();
    expect(screen.getByText("Welcome text")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Privacy" })).toBeInTheDocument();
    expect(screen.getByText("Data usage paragraph")).toBeInTheDocument();
  });

  it("normalizes supplier using trim and lower-case", () => {
    render(<SuppliersPrivacyPolicyContent supplier="  PREVENTX  " />);

    expect(screen.getByRole("heading", { name: "Preventx privacy policy" })).toBeInTheDocument();
  });

  it("renders URL text as links", () => {
    render(<SuppliersPrivacyPolicyContent supplier="preventx" />);

    const introLink = screen.getByRole("link", { name: /https:\/\/example\.org\/info/i });
    const listLink = screen.getByRole("link", { name: /https:\/\/example\.org\/list/i });

    expect(introLink).toHaveAttribute("href", "https://example.org/info");
    expect(listLink).toHaveAttribute("href", "https://example.org/list");
  });

  it("throws when supplier is missing", () => {
    expect(() => render(<SuppliersPrivacyPolicyContent supplier={undefined} />)).toThrow(
      "Unknown supplier: missing supplier",
    );
  });

  it("throws when supplier is unknown", () => {
    expect(() => render(<SuppliersPrivacyPolicyContent supplier="unknown" />)).toThrow(
      "Unknown supplier: unknown",
    );
  });
});
