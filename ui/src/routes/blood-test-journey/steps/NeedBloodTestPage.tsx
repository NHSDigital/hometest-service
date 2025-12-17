import { Card, HintText } from 'nhsuk-react-components';
import { OpensInNewTabLink } from '../../../lib/components/opens-in-new-tab-link';
import { GiveFeedbackSection } from '../../../lib/components/give-feedback-section';
import { type IHealthCheck } from '@dnhc-health-checks/shared';

interface NeedBloodTestPageProps {
  healthCheck?: IHealthCheck;
  patientId: string;
}

export default function NeedBloodTestPage({
  healthCheck,
  patientId
}: NeedBloodTestPageProps) {
  return (
    <>
      <Card>
        <Card.Content>
          <Card.Heading headingLevel="h1">
            Book a face-to-face appointment with your GP surgery
          </Card.Heading>
        </Card.Content>
      </Card>
      <div>
        <p>
          To complete your NHS Health Check online, we need a blood sample. This
          helps us to spot early signs of conditions like heart disease, stroke
          and type 2 diabetes.
        </p>
        <p>
          If you do not want to take a blood test, or cannot take a sample
          yourself, you should contact your GP surgery.
        </p>
        <p>
          Your GP surgery will explain how you can complete your NHS Health
          Check.
        </p>
        <p>
          In the meantime, here is more information from the NHS to help support
          your health and wellbeing.
        </p>
        <HintText>The following links open in a new tab.</HintText>
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
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/better-health/how-are-you-quiz/"
            linkText="How Are You? (Free personalised health score)"
            includeNewTabMessage={false}
          />
        </p>
      </div>
      <GiveFeedbackSection healthCheck={healthCheck} patientId={patientId} />
    </>
  );
}
