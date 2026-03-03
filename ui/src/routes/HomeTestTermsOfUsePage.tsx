"use client";

import { useNavigate } from "react-router-dom";
import { useContent } from "@/hooks";
import PageLayout from "@/layouts/PageLayout";
import { BackLink } from "nhsuk-react-components";
import { renderTextWithLinks, cleanListItems, getListClass } from "@/utils/renderTextWithLinks";
import "@/styles/lists.css";

export default function HomeTestTermsOfUsePage() {
  const navigate = useNavigate();
  const { "home-test-terms-of-use": content } = useContent();

  /**
   * Renders a paragraph, auto-bolding the leading paragraph reference number (e.g. "1.1. ")
   */
  const renderParagraphs = (paragraphs: string[]) => {
    return paragraphs.map((paragraph, index) => {
      const numberMatch = paragraph.match(/^(\d+\.\d+\.?\s+)/);
      if (numberMatch) {
        const number = numberMatch[1];
        const rest = paragraph.slice(number.length);
        return (
          <p key={index} className="nhsuk-body">
            <strong>{number}</strong>
            {renderTextWithLinks(rest, `p${index}-`)}
          </p>
        );
      }
      return (
        <p key={index} className="nhsuk-body">
          {renderTextWithLinks(paragraph, `p${index}-`)}
        </p>
      );
    });
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

  const renderTable = (table: { caption?: string; headers: string[]; rows: string[][] }) => {
    return (
      <table className="nhsuk-table nhsuk-u-margin-top-4">
        {table.caption && <caption className="nhsuk-table__caption">{table.caption}</caption>}
        <thead className="nhsuk-table__head">
          <tr>
            {table.headers.map((header, i) => (
              <th key={i} scope="col" className="nhsuk-table__header">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="nhsuk-table__body">
          {table.rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="nhsuk-table__row">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="nhsuk-table__cell">
                  {cell.split("\n").map((line, lineIdx) => (
                    <p key={lineIdx} className="nhsuk-body nhsuk-u-margin-bottom-1">
                      {renderTextWithLinks(line, `tbl-${rowIdx}-${cellIdx}-${lineIdx}-`)}
                    </p>
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
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
              {subsection.heading && <h3 className="nhsuk-heading-s">{subsection.heading}</h3>}

              {subsection.paragraphs && renderParagraphs(subsection.paragraphs)}

              {subsection.list &&
                renderList(subsection.list, subsection.ordered, subsection.indented)}

              {subsection.table && renderTable(subsection.table)}
            </div>
          ))}
        </section>
      ))}
    </PageLayout>
  );
}
