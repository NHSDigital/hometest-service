"use client";

import PageLayout from "@/layouts/PageLayout";
import { useContent } from "@/hooks";
import { useNavigate } from "react-router-dom";
import { renderTextWithLinks, cleanListItems, getListClass } from "@/utils/renderTextWithLinks";

export default function HomeTestPrivacyPolicyPage() {
  const navigate = useNavigate();
  const { "home-test-privacy-policy": content } = useContent();

  const renderHeading = (text: string) => {
    const numberMatch = text.match(/^(\d+\.\s+)/);
    if (numberMatch) {
      return (
        <>
          <strong>{numberMatch[1]}</strong>
          {text.slice(numberMatch[1].length)}
        </>
      );
    }
    return text;
  };

  const renderParagraphs = (paragraphs: string[]) => {
    return paragraphs.map((paragraph, index) => (
      <p key={index} className="nhsuk-body">
        {renderTextWithLinks(paragraph, `p${index}-`)}
      </p>
    ));
  };

  const renderList = (items: string[], ordered?: boolean, indented?: boolean) => {
    const cleanedItems = cleanListItems(items);
    const ListTag = ordered ? "ol" : "ul";
    const listClass = getListClass(items);
    const list = (
      <ListTag className={listClass}>
        {cleanedItems.map((item, index) => (
          <li key={index}>{renderTextWithLinks(item, `li${index}-`)}</li>
        ))}
      </ListTag>
    );
    return indented ? <div className="nhsuk-u-margin-left-4">{list}</div> : list;
  };

  return (
    <PageLayout onBackButtonClick={() => navigate(-1)}>
      <h1 className="nhsuk-heading-l">{content.title}</h1>

      {renderParagraphs(content.introduction)}

      {content.sections.map((section) => (
        <section
          key={section.id}
          aria-labelledby={`section-${section.id}`}
          className="nhsuk-u-margin-top-7"
        >
          <h2 id={`section-${section.id}`} className="nhsuk-heading-m">
            {renderHeading(section.heading)}
          </h2>

          {renderParagraphs(section.paragraphs)}

          {section.subsections?.map((subsection, subIndex) => (
            <div key={subIndex} className="nhsuk-u-margin-top-4">
              {subsection.heading &&
                (subsection.inlineHeading ? (
                  <h3 className="nhsuk-heading-s" style={{ display: "inline" }}>
                    {subsection.heading}
                  </h3>
                ) : (
                  <h3 className="nhsuk-heading-s">{subsection.heading}</h3>
                ))}

              {subsection.paragraphs && renderParagraphs(subsection.paragraphs)}

              {subsection.list &&
                renderList(
                  subsection.list,
                  subsection.listStyle === "ordered",
                  subsection.indented,
                )}
            </div>
          ))}
        </section>
      ))}
    </PageLayout>
  );
}
