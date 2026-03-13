import {Link} from "react-router-dom";
import type {ReactNode} from "react";
import {OpensInNewTabLink} from "@/components/OpensInNewTabLink";

const BOLD = /\*\*([^*]+)\*\*/; // **bold text**
const MARKDOWN_LINK = /\[([^\][\n]+)]\(([^()\n]+)\)/; // [display text](href)
// display text: any char except ], [, newline
// href: any char except (, ), newline

/**
 * Renders a text string, converting:
 * - **text** → <strong>text</strong> (supports nested bold)
 * - [display text](href) → internal React Router <Link> (for /paths) or external <OpensInNewTabLink> (for http(s) URLs)
 */
export const renderTextWithLinks = (text: string, keyPrefix = ""): ReactNode[] => {
  const combinedRegex = new RegExp(`${BOLD.source}|${MARKDOWN_LINK.source}`, "g");
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    const [fullMatch, boldText, linkText, href] = match;

    if (match.index > lastIndex) {
      parts.push(
        <span key={`${keyPrefix}text-${match.index}`}>{text.slice(lastIndex, match.index)}</span>,
      );
    }

    if (boldText !== undefined) {
      // **bold** text — recurse to support bold+link combos
      const innerParts = renderTextWithLinks(boldText, `${keyPrefix}b${match.index}-`);
      parts.push(<strong key={`${keyPrefix}bold-${match.index}`}>{innerParts}</strong>);
    } else {
      // Markdown-style link [display text](href)
      const isExternal = href.startsWith("http");

      if (isExternal) {
        parts.push(
          <OpensInNewTabLink
            key={`${keyPrefix}ext-${match.index}`}
            linkText={linkText}
            linkHref={href}
          />,
        );
      } else {
        parts.push(
          <Link key={`${keyPrefix}int-${match.index}`} to={href} className="nhsuk-link">
            {linkText}
          </Link>,
        );
      }
    }

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`${keyPrefix}text-end`}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : [<span key={`${keyPrefix}plain`}>{text}</span>];
};

/**
 * Returns the appropriate NHS list CSS class based on the explicit list metadata.
 * ordered=true → plain nhsuk-list (no bullet/dash modifier, rendered as <ol>)
 * listStyle="dash" → nhsuk-list nhsuk-list--dash
 * default → nhsuk-list nhsuk-list--bullet
 */
export const getListClass = (ordered?: boolean, listStyle?: "bullet" | "dash"): string => {
  if (ordered) return "nhsuk-list";
  if (listStyle === "dash") return "nhsuk-list nhsuk-list--dash";
  return "nhsuk-list nhsuk-list--bullet";
};

/**
 * Removes dash prefix from list items if present
 */
export const cleanListItems = (items: string[]): string[] => {
  return items.map((item) => (item.trim().startsWith("- ") ? item.replace(/^-\s+/, "") : item));
};
