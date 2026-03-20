import { FormBackLink } from "../components/FormBackLink";
import { LoadingSpinner } from "../components/LoadingSpinner";

interface FormPageLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  backButtonText?: string;
  onBackButtonClick?: () => void;
  isLoading?: boolean;
  loadingMessage?: string;
}

export default function FormPageLayout({
  children,
  showBackButton = false,
  backButtonText,
  onBackButtonClick,
  isLoading = false,
  loadingMessage = "Submitting your order",
}: Readonly<FormPageLayoutProps>) {
  if (isLoading) {
    return (
      <div className="nhsuk-width-container">
        <LoadingSpinner message={loadingMessage} />
      </div>
    );
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
