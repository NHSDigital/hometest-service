import { Card } from 'nhsuk-react-components';
import { OpensInNewTabLink } from '../../../lib/components/opens-in-new-tab-link';
import { GiveFeedbackSection } from '../../../lib/components/give-feedback-section';
import { type IHealthCheck } from '@dnhc-health-checks/shared';

export interface SorryCannotGetHealthCheckWithPreviousHeathcheckCompletedProps {
  healthCheck?: IHealthCheck;
  patientId: string;
}

export default function SorryCannotGetHealthCheckWithPreviousHeathcheckCompleted({
  healthCheck,
  patientId
}: SorryCannotGetHealthCheckWithPreviousHeathcheckCompletedProps) {
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
        You can only get an NHS Health Check if you have not had one in the last
        5 years.
      </p>

      <p>
        If you have concerns about your health or symptoms, speak to your GP.
      </p>
      <p>
        Here is more information from the NHS to support your health and
        wellbeing.
      </p>

      <p>The following links open in a new tab.</p>
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
