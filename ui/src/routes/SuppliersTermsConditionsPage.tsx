import { useNavigate, useSearchParams } from "react-router-dom";

import { OpensInNewTabLink } from "@/components/OpensInNewTabLink";
import PageLayout from "@/layouts/PageLayout";
import { usePageContent } from "@/hooks";

export default function SuppliersTermsConditionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const supplier = searchParams.get("supplier")?.trim().toLowerCase();
  const content = usePageContent("suppliers-terms-conditions");

  if (!supplier) {
    throw new Error("Unknown supplier: missing supplier");
  }

  if (!Object.hasOwn(content.suppliers, supplier)) {
    throw new Error(`Unknown supplier: ${supplier}`);
  }

  const supplierContent = content.suppliers[supplier];
  const title = supplierContent.title;

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
    <PageLayout onBackButtonClick={() => navigate(-1)}>
      <h1 className="nhsuk-heading-l">{title}</h1>

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
    </PageLayout>
  );
}
