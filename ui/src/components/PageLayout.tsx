import { FormBackLink } from "./FormBackLink";

interface PageLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  backButtonText?: string;
  onBackButtonClick?: () => void;
}

export function PageLayout({
  children,
  showBackButton = false,
  backButtonText,
  onBackButtonClick,
}: PageLayoutProps) {
  return (
    <div className="nhsuk-width-container">
      {showBackButton && (
        <FormBackLink text={backButtonText} onClick={onBackButtonClick} />
      )}
      <main className="nhsuk-main-wrapper" id="maincontent" role="main">
        <div className="nhsuk-grid-row">
          <div className="nhsuk-grid-column-two-thirds">{children}</div>
        </div>
      </main>
    </div>
  );
}
