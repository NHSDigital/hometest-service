import { Card } from 'nhsuk-react-components';
import { OpensInNewTabLink } from '../../../lib/components/opens-in-new-tab-link';
import { GiveFeedbackSection } from '../../../lib/components/give-feedback-section';
import type { IHealthCheck } from '@dnhc-health-checks/shared';

export interface ExtendedExclusionsShutterPageProps {
  healthCheck?: IHealthCheck;
  patientId: string;
}

export default function ExtendedExclusionsShutterPage({
  healthCheck,
  patientId
}: ExtendedExclusionsShutterPageProps) {
  return (
    <>
      <Card>
        <Card.Content>
          <Card.Heading headingLevel="H1">
            Book a face-to-face appointment with your GP surgery
          </Card.Heading>
        </Card.Content>
      </Card>
      <p>
        Ask your GP surgery about completing your NHS Health Check in a
        face-to-face appointment.
      </p>
      <p>
        This is so a clinician can make sure you get the right advice and
        guidance for your condition.
      </p>
      <p>
        In the meantime, here is more information from the NHS to help support
        your health and wellbeing.
      </p>
      <p>The following links open in a new tab</p>
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
      <GiveFeedbackSection healthCheck={healthCheck} patientId={patientId} />
    </>
  );
}
