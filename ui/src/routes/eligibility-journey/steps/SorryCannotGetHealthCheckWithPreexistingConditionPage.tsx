import { Card } from 'nhsuk-react-components';
import { GiveFeedbackSection } from '../../../lib/components/give-feedback-section';
import { type IHealthCheck } from '@dnhc-health-checks/shared';
import { OpensInNewTabLink } from '../../../lib/components/opens-in-new-tab-link';

export interface SorryCannotGetHealthCheckWithPreexistingConditionPageProps {
  healthCheck?: IHealthCheck;
  patientId: string;
}

export default function SorryCannotGetHealthCheckWithPreexistingConditionPage({
  healthCheck,
  patientId
}: SorryCannotGetHealthCheckWithPreexistingConditionPageProps) {
  return (
    <>
      <Card>
        <Card.Content>
          <Card.Heading headingLevel="H1">
            Sorry, you cannot get an NHS Health Check right now
          </Card.Heading>
        </Card.Content>
      </Card>

      <p>
        If you have a pre-existing condition you cannot have the NHS Health
        Check.
      </p>

      <p>
        You should have regular check-ups about your condition. Your care team
        will be able to give you more information about this.
      </p>
      <p>
        Here is more information from the NHS to help support your health and
        wellbeing.
      </p>

      <p> The following links open in a new tab. </p>
      <div>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/conditions/nhs-health-check"
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
            linkHref="https://www.nhs.uk/health-assessment-tools/calculate-your-body-mass-index"
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
            linkHref="https://www.nhs.uk/live-well"
            linkText="Healthy lifestyle support"
            includeNewTabMessage={false}
          />
        </p>
      </div>

      <GiveFeedbackSection healthCheck={healthCheck} patientId={patientId} />
    </>
  );
}
