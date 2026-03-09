import "@testing-library/jest-dom";

import { render } from "@testing-library/react";

import { SupplierLegalDocumentContent } from "@/components/SupplierLegalDocumentContent";
import { type LegalDocumentContent as LegalDocumentContentType } from "@/content/schema";

const mockUsePageContent = jest.fn();
const mockLegalDocumentContent: jest.Mock<null, [{ content: LegalDocumentContentType }]> = jest.fn<
  null,
  [{ content: LegalDocumentContentType }]
>(() => null);

const supplierContent: LegalDocumentContentType = {
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
};

jest.mock("@/components/LegalDocumentContent", () => ({
  LegalDocumentContent: (props: { content: LegalDocumentContentType }) =>
    mockLegalDocumentContent(props),
}));

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
          ...supplierContent,
          title,
        },
      },
    });
  });

  it("uses the expected content key and renders supplier content", () => {
    render(<SupplierLegalDocumentContent supplier="preventx" documentType={documentType} />);

    expect(mockUsePageContent).toHaveBeenCalledWith(contentKey);
    expect(mockLegalDocumentContent).toHaveBeenCalledWith({
      content: {
        ...supplierContent,
        title,
      },
    });
  });

  it("normalizes supplier using trim and lower-case", () => {
    render(<SupplierLegalDocumentContent supplier="  PREVENTX  " documentType={documentType} />);

    expect(mockLegalDocumentContent).toHaveBeenCalledWith({
      content: {
        ...supplierContent,
        title,
      },
    });
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
