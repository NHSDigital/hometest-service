import { BackLink } from "nhsuk-react-components";

interface PageLayoutProps {
  children: React.ReactNode;
  onBackButtonClick?: () => void;
}

export default function PageLayout({ children, onBackButtonClick }: Readonly<PageLayoutProps>) {
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
