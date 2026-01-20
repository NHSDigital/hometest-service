interface PageLayoutProps {
  children: React.ReactNode;
}

// TODO: add back button with displayNhsAppServicesBackButton prop or something similar

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="nhsuk-width-container">
      <main className="nhsuk-main-wrapper" id="maincontent" role="main">
        <div className="nhsuk-grid-row">
          <div className="nhsuk-grid-column-two-thirds">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
