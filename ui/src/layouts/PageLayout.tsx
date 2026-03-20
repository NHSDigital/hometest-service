import { BackLink } from "nhsuk-react-components";
import { LoadingSpinner } from "../components/LoadingSpinner";

interface PageLayoutProps {
  children?: React.ReactNode;
  onBackButtonClick?: () => void;
  isLoading?: boolean;
  loadingMessage?: string;
}

export default function PageLayout({
  children,
  onBackButtonClick,
  isLoading = false,
  loadingMessage = "Submitting your order",
}: Readonly<PageLayoutProps>) {
  if (isLoading) {
    return (
      <div className="nhsuk-width-container">
        <LoadingSpinner message={loadingMessage} />
      </div>
    );
  }

  return (
    <div className="nhsuk-width-container">
      {onBackButtonClick && <BackLink onClick={onBackButtonClick}>Back</BackLink>}
      <main className="nhsuk-main-wrapper" id="maincontent" role="main">
        <div className="nhsuk-grid-row">
          <div className="nhsuk-grid-column-two-thirds">{children}</div>
        </div>
      </main>
    </div>
  );
}
