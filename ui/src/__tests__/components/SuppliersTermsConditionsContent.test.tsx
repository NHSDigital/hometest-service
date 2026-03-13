import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { SuppliersTermsConditionsContent } from "@/components/SuppliersTermsConditionsContent";

const mockUsePageContent = jest.fn();

jest.mock("@/hooks", () => ({
  usePageContent: () => mockUsePageContent(),
}));

describe("SuppliersTermsConditionsContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePageContent.mockReturnValue({
      suppliers: {
        preventx: {
          title: "Preventx terms of use",
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
    render(<SuppliersTermsConditionsContent supplier="preventx" />);

    expect(screen.getByRole("heading", { name: "Preventx terms of use" })).toBeInTheDocument();
    expect(screen.getByText("Welcome text")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Privacy" })).toBeInTheDocument();
    expect(screen.getByText("Data usage paragraph")).toBeInTheDocument();
  });

  it("normalizes supplier using trim and lower-case", () => {
    render(<SuppliersTermsConditionsContent supplier="  PREVENTX  " />);

    expect(screen.getByRole("heading", { name: "Preventx terms of use" })).toBeInTheDocument();
  });

  it("renders URL text as links", () => {
    render(<SuppliersTermsConditionsContent supplier="preventx" />);

    const introLink = screen.getByRole("link", { name: /https:\/\/example\.org\/info/i });
    const listLink = screen.getByRole("link", { name: /https:\/\/example\.org\/list/i });

    expect(introLink).toHaveAttribute("href", "https://example.org/info");
    expect(listLink).toHaveAttribute("href", "https://example.org/list");
  });

  it("throws when supplier is missing", () => {
    expect(() => render(<SuppliersTermsConditionsContent supplier={undefined} />)).toThrow(
      "Unknown supplier: missing supplier",
    );
  });

  it("throws when supplier is unknown", () => {
    expect(() => render(<SuppliersTermsConditionsContent supplier="unknown" />)).toThrow(
      "Unknown supplier: unknown",
    );
  });
});
