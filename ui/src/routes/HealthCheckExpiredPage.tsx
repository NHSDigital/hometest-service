import { Card } from 'nhsuk-react-components';
import PageLayout from '../layouts/PageLayout';
import { OpensInNewTabLink } from '../lib/components/opens-in-new-tab-link';
import { GiveFeedbackSection } from '../lib/components/give-feedback-section';

export default function HealthCheckExpiredPage() {
  return (
    <PageLayout displayNhsAppServicesBackButton={true}>
      <Card>
        <Card.Content>
          <Card.Heading headingLevel="H1">
            Your home test request has expired
          </Card.Heading>
        </Card.Content>
      </Card>
      <div>
        <p>The time to complete your home test request has expired.</p>
        <p>
          If you have completed any sections, these
          will be saved to your health record.
        </p>
        <p>
          Contact your GP surgery for more information about home testing.
        </p>
        <p>
          For more information about how we process and protect your data, see
          the{' '}
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/nhs-services/online-services/get-your-nhs-health-check-online/legal-and-cookies/privacy-policy"
            linkText="Privacy Policy"
            includeNewTabMessage={true}
          />
          .
        </p>
        <p>
          In the meantime, here is more information from the NHS to help support
          your health and wellbeing.
        </p>
      </div>

      <div>
        <p>The following links open in a new tab.</p>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/conditions/nhs-health-check/"
            linkText="Find out more about NHS Health Checks"
            includeNewTabMessage={false}
          />
        </p>
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
      </div>
      <GiveFeedbackSection />
    </PageLayout>
  );
}
