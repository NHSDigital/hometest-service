import { Link } from "react-router-dom";
import type { ReactNode } from "react";

/**
 * Renders a text string, converting:
 * - **text** → <strong>text</strong> (supports nested bold)
 * - [display text](url) → internal React Router <Link> (for /paths) or external <a> (for https://)
 * - bare https://... URLs → external <a target="_blank">
 */
export const renderTextWithLinks = (text: string, keyPrefix = ""): ReactNode[] => {
  const combinedRegex = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s]+(?<![.,;)]))/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`${keyPrefix}text-${match.index}`}>{text.slice(lastIndex, match.index)}</span>,
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
 * Detects if list items are dash-styled (start with "- ")
 * and returns appropriate list class
 */
export const getListClass = (items: string[]): string => {
  const isDashList = items.some((item) => item.trim().startsWith("- "));
  if (isDashList) {
    return "nhsuk-list nhsuk-list--dash";
  }
  return "nhsuk-list nhsuk-list--bullet";
};

/**
 * Removes dash prefix from list items if present
 */
export const cleanListItems = (items: string[]): string[] => {
  return items.map((item) => (item.trim().startsWith("- ") ? item.replace(/^-\s+/, "") : item));
};
