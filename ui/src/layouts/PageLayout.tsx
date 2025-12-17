import { type PropsWithChildren, type ReactNode } from 'react';
import FormBackButton from '../lib/components/FormBackButton';

interface HealthCheckSectionProps {
  backToUrl?: string;
  displayNhsAppServicesBackButton?: boolean;
}

export default function PageLayout(
  props: PropsWithChildren<HealthCheckSectionProps>
) {
  function renderContent(content: ReactNode | undefined) {
    return (
      <>
        <FormBackButton
          backToUrl={props.backToUrl}
          displayNhsAppServicesBackButton={
            props.displayNhsAppServicesBackButton
          }
        >
          Back
        </FormBackButton>
        <main
          className={`nhsuk-main-wrapper ${props.backToUrl ? 'nhsuk-main-wrapper--s' : ''}`}
          id="maincontent"
          role="main"
        >
          <div className="nhsuk-grid-row">
            <div className="nhsuk-grid-column-two-thirds">{content}</div>
          </div>
        </main>
      </>
    );
  }

  return renderContent(props.children);
}
