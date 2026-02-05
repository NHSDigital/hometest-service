interface OpensInNewTabLinkProps {
  linkHref: string;
  linkText: string;
  onClick?: () => Promise<void>;
}

export function OpensInNewTabLink({
  linkHref,
  linkText,
  onClick,
}: Readonly<OpensInNewTabLinkProps>) {
  const handleClick = async () => {
    if (onClick) {
      await onClick();
    }
  };

  return (
    <a
      className="nhsuk-link"
      href={linkHref}
      target="_blank"
      rel="noreferrer noopener"
      onClick={handleClick}
    >
      {linkText}
      <span className="nhsuk-u-visually-hidden">(opens in new tab)</span>
    </a>
  );
}
