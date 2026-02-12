"use client";

import { useNavigate } from "react-router-dom";
import { useContent } from "@/hooks";
import PageLayout from "@/layouts/PageLayout";
import { BackLink } from "nhsuk-react-components";

export default function HomeTestPrivacyPolicyPage() {
  const navigate = useNavigate();
  const { "home-test-privacy-policy": content } = useContent();

  const renderTextWithLinks = (text: string) => {
    // Regular expression to detect URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            className="nhsuk-link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${part} (opens in new tab)`}
          >
            {part}
          </a>
        );
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
    return items.map((item, index) => (
      <li key={index}>{renderTextWithLinks(item)}</li>
    ));
  };

  return (
    <PageLayout>
      <BackLink onClick={() => navigate(-1)} href="#">
        Back
      </BackLink>

      <h1 className="nhsuk-heading-l nhsuk-u-margin-top-5">{content.title}</h1>

      {renderParagraphs(content.introduction)}

      {content.sections.map((section) => (
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
            <div key={subIndex} className="nhsuk-u-margin-top-4">
              {subsection.heading && (
                <h3 className="nhsuk-heading-s">{subsection.heading}</h3>
              )}

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
