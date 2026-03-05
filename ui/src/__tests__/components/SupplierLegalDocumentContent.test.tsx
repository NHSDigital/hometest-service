import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { SupplierLegalDocumentContent } from "@/components/SupplierLegalDocumentContent";

const mockUsePageContent = jest.fn();

jest.mock("@/hooks", () => ({
  usePageContent: (...args: unknown[]) => mockUsePageContent(...args),
}));

describe.each([
  {
    contentKey: "suppliers-privacy-policy",
    documentType: "privacy" as const,
    title: "Preventx privacy policy",
  },
  {
    contentKey: "suppliers-terms-conditions",
    documentType: "terms" as const,
    title: "Preventx terms of use",
  },
])("SupplierLegalDocumentContent ($documentType)", ({ documentType, title, contentKey }) => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePageContent.mockReturnValue({
      suppliers: {
        preventx: {
          title,
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
    render(<SupplierLegalDocumentContent supplier="preventx" documentType={documentType} />);

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText("Welcome text")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Privacy" })).toBeInTheDocument();
    expect(screen.getByText("Data usage paragraph")).toBeInTheDocument();
    expect(mockUsePageContent).toHaveBeenCalledWith(contentKey);
  });

  it("normalizes supplier using trim and lower-case", () => {
    render(<SupplierLegalDocumentContent supplier="  PREVENTX  " documentType={documentType} />);

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
  });

  it("renders URL text as links", () => {
    render(<SupplierLegalDocumentContent supplier="preventx" documentType={documentType} />);

    const introLink = screen.getByRole("link", { name: /https:\/\/example\.org\/info/i });
    const listLink = screen.getByRole("link", { name: /https:\/\/example\.org\/list/i });

    expect(introLink).toHaveAttribute("href", "https://example.org/info");
    expect(listLink).toHaveAttribute("href", "https://example.org/list");
  });

  it("throws when supplier is missing", () => {
    expect(() =>
      render(<SupplierLegalDocumentContent supplier={undefined} documentType={documentType} />),
    ).toThrow("Unknown supplier: missing supplier");
  });

  it("throws when supplier is unknown", () => {
    expect(() =>
      render(<SupplierLegalDocumentContent supplier="unknown" documentType={documentType} />),
    ).toThrow("Unknown supplier: unknown");
  });
});
