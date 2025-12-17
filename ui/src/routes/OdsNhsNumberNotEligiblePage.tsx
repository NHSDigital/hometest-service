import { Card } from 'nhsuk-react-components';
import PageLayout from '../layouts/PageLayout';
import { GiveFeedbackSection } from '../lib/components/give-feedback-section';
import { OpensInNewTabLink } from '../lib/components/opens-in-new-tab-link';

export default function OdsNhsNumberNotEligiblePage() {
  return (
    <PageLayout displayNhsAppServicesBackButton={false}>
      <Card>
        <Card.Content>
          <Card.Heading headingLevel="H1">Contact your GP surgery</Card.Heading>
        </Card.Content>
      </Card>

      <p>
        The NHS Health Check online is a new service. Right now it is in a test
        phase.
      </p>
      <p>
        This service is available by invitation only to a small group of
        patients from participating GP surgeries.
      </p>
      <p>
        You might be able to complete an NHS Health Check online in the future.
      </p>
      <p>
        In the meantime, if you are aged between 40 and 74, you might be
        eligible to have an NHS Health Check in person.
      </p>
      <p>To find out more, contact your GP surgery.</p>

      <h3>Useful resources</h3>
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
      <GiveFeedbackSection logAuditEvent={false} />
    </PageLayout>
  );
}
