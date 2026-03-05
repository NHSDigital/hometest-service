import { OpensInNewTabLink } from "@/components/OpensInNewTabLink";
import { usePageContent } from "@/hooks";

type SupplierLegalDocumentType = "terms" | "privacy";

type SupplierLegalDocumentContentProps = {
  supplier?: string | null;
  documentType: SupplierLegalDocumentType;
};

export function SupplierLegalDocumentContent({
  supplier,
  documentType,
}: Readonly<SupplierLegalDocumentContentProps>) {
  const normalizedSupplier = supplier?.trim().toLowerCase();
  const contentKeyByDocumentType: Record<SupplierLegalDocumentType, string> = {
    terms: "suppliers-terms-conditions",
    privacy: "suppliers-privacy-policy",
  };
  const content = usePageContent(contentKeyByDocumentType[documentType]);

  if (!normalizedSupplier) {
    throw new Error("Unknown supplier: missing supplier");
  }

  if (!Object.hasOwn(content.suppliers, normalizedSupplier)) {
    throw new Error(`Unknown supplier: ${normalizedSupplier}`);
  }

  const supplierContent = content.suppliers[normalizedSupplier];

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return <OpensInNewTabLink key={index} linkHref={part} linkText={part} />;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const renderParagraphs = (paragraphs: string[]) => {
    return paragraphs.map((paragraph, index) => (
      <p key={index} className="nhsuk-body">
        {renderTextWithLinks(paragraph)}
      </p>
    ));
  };

  const renderListItems = (items: string[]) => {
    return items.map((item, index) => <li key={index}>{renderTextWithLinks(item)}</li>);
  };

  return (
    <>
      <h1 className="nhsuk-heading-l">{supplierContent.title}</h1>

      {renderParagraphs(supplierContent.introduction)}

      {supplierContent.sections.map((section) => (
        <section
          key={section.id}
          aria-labelledby={`section-${section.id}`}
          className="nhsuk-u-margin-top-7"
        >
          <h2 id={`section-${section.id}`} className="nhsuk-heading-m">
            {section.heading}
          </h2>

          {renderParagraphs(section.paragraphs)}

          {section.subsections?.map((subsection, subIndex) => (
            <div key={subIndex}>
              {subsection.heading && <h3 className="nhsuk-heading-s">{subsection.heading}</h3>}

              {subsection.paragraphs && renderParagraphs(subsection.paragraphs)}

              {subsection.list && (
                <ul className="nhsuk-list nhsuk-list--bullet">
                  {renderListItems(subsection.list)}
                </ul>
              )}
            </div>
          ))}
        </section>
      ))}
    </>
  );
}
