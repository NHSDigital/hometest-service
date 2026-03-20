import { FormBackLink } from "../components/FormBackLink";

interface FormPageLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  backButtonText?: string;
  onBackButtonClick?: () => void;
  loadingOverlay?: React.ReactNode;
}

export default function FormPageLayout({
  children,
  showBackButton = false,
  backButtonText,
  onBackButtonClick,
  loadingOverlay,
}: Readonly<FormPageLayoutProps>) {
  if (loadingOverlay) {
    return <div className="nhsuk-width-container">{loadingOverlay}</div>;
  }

  return (
    <div className="nhsuk-width-container">
      {showBackButton && <FormBackLink text={backButtonText} onClick={onBackButtonClick} />}
      <main className="nhsuk-main-wrapper" id="maincontent" role="main">
        <div className="nhsuk-grid-row">
          <div className="nhsuk-grid-column-two-thirds">{children}</div>
        </div>
      </main>
    </div>
  );
}
