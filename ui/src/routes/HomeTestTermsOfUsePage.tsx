"use client";

import { Link, useNavigate } from "react-router-dom";
import { useContent } from "@/hooks";
import PageLayout from "@/layouts/PageLayout";
import { BackLink } from "nhsuk-react-components";

export default function HomeTestTermsOfUsePage() {
  const navigate = useNavigate();
  const { "home-test-terms-of-use": content } = useContent();

  /**
   * Renders a text string, converting:
   * - **text** → <strong>text</strong> (supports nested links inside bold)
   * - [display text](url) → internal React Router <Link> (for /paths) or external <a> (for https://)
   * - bare https://... URLs → external <a target="_blank">
   */
  const renderTextWithLinks = (text: string, keyPrefix = ""): React.ReactNode[] => {
    const combinedRegex =
      /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s]+(?<![.,;)]))/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`${keyPrefix}text-${match.index}`}>
            {text.slice(lastIndex, match.index)}
          </span>,
        );
      }

      if (match[1] !== undefined) {
        // **bold** text — recurse to support bold+link combos
        const boldContent = match[1];
        const innerParts = renderTextWithLinks(boldContent, `${keyPrefix}b${match.index}-`);
        parts.push(<strong key={`${keyPrefix}bold-${match.index}`}>{innerParts}</strong>);
      } else if (match[4]) {
        // Bare https:// URL
        const url = match[4];
        parts.push(
          <a
            key={`${keyPrefix}ext-${match.index}`}
            href={url}
            className="nhsuk-link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${url} (opens in new tab)`}
          >
            {url}
          </a>,
        );
      } else {
        // Markdown-style link [display text](href)
        const linkText = match[2];
        const href = match[3];
        const isExternal = href.startsWith("http");

        if (isExternal) {
          parts.push(
            <a
              key={`${keyPrefix}ext-${match.index}`}
              href={href}
              className="nhsuk-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${linkText} (opens in new tab)`}
            >
              {linkText}
            </a>,
          );
        } else {
          parts.push(
            <Link key={`${keyPrefix}int-${match.index}`} to={href} className="nhsuk-link">
              {linkText}
            </Link>,
          );
        }
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(<span key={`${keyPrefix}text-end`}>{text.slice(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : [<span key={`${keyPrefix}plain`}>{text}</span>];
  };

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

  const renderListItems = (items: string[]) => {
    return items.map((item, index) => (
      <li key={index}>{renderTextWithLinks(item, `li${index}-`)}</li>
    ));
  };

  const renderTable = (table: {
    caption?: string;
    headers: string[];
    rows: string[][];
  }) => {
    return (
      <table className="nhsuk-table nhsuk-u-margin-top-4">
        {table.caption && (
          <caption className="nhsuk-table__caption">{table.caption}</caption>
        )}
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
              {subsection.heading && (
                <h3 className="nhsuk-heading-s">{subsection.heading}</h3>
              )}

              {subsection.paragraphs && renderParagraphs(subsection.paragraphs)}

              {subsection.list && (() => {
                const ListTag = subsection.ordered ? "ol" : "ul";
                const listClass = subsection.ordered
                  ? "nhsuk-list nhsuk-list--number"
                  : "nhsuk-list nhsuk-list--bullet";
                const list = (
                  <ListTag className={listClass}>
                    {renderListItems(subsection.list)}
                  </ListTag>
                );
                return subsection.indented ? (
                  <div className="nhsuk-u-margin-left-4">{list}</div>
                ) : list;
              })()}

              {subsection.table && renderTable(subsection.table)}
            </div>
          ))}
        </section>
      ))}
    </PageLayout>
  );
}
