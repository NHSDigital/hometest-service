import PageLayout from '../layouts/PageLayout';
import { GiveFeedbackSection } from '../lib/components/give-feedback-section';
import { OpensInNewTabLink } from '../lib/components/opens-in-new-tab-link';

export default function NotEligiblePage() {
  return (
    <PageLayout displayNhsAppServicesBackButton={true}>
      <h1>Sorry, you cannot get an NHS Health Check</h1>

      <p>The NHS Health Check is for people who are aged 40 to 74</p>
      <p>According to your NHS health record, you are not in this age range.</p>
      <p>
        If you have concerns about your health or symptoms, speak to your GP.
      </p>
      <p>
        Here is more information from the NHS to help support your health and
        wellbeing.
      </p>
      <p>The following links open in a new tab.</p>
      <p>
        <OpensInNewTabLink
          linkHref="https://111.nhs.uk/"
          linkText="Check your symptoms on NHS 111 online"
          includeNewTabMessage={false}
        />
      </p>
      <p>
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/health-assessment-tools/calculate-your-body-mass-index/"
          linkText="BMI Healthy weight calculator"
          includeNewTabMessage={false}
        />
      </p>
      <p>
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/health-assessment-tools/calculate-your-heart-age"
          linkText="Calculate your heart age"
          includeNewTabMessage={false}
        />
      </p>
      <p>
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/live-well/"
          linkText="Healthy lifestyle support"
          includeNewTabMessage={false}
        />
      </p>
      <GiveFeedbackSection logAuditEvent={false} />
    </PageLayout>
  );
}
