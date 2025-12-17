import { Card, Details } from 'nhsuk-react-components';
import { OpensInNewTabLink } from '../../../../lib/components/opens-in-new-tab-link';
import { useHealthCheck } from '../../../../hooks/healthCheckHooks';
import { Redirecting } from '../../../../lib/pages/redirecting';
import { PhoneAnchor } from '../../../../lib/components/phone-anchor';
import { OneOneOneNumber } from '../../../../lib/components/one-one-one-number';
import { AuditEventType, type IHealthCheck } from '@dnhc-health-checks/shared';
import { useAuditEvent } from '../../../../hooks/eventAuditHook';
import { useEffect } from 'react';
import { Spinner } from '../../../../lib/pages/spinner';

interface BloodPressureVeryLowPageProps {
  healthCheck?: IHealthCheck;
  patientId: string;
}

export default function LowBloodPressureShutterPage({
  patientId
}: BloodPressureVeryLowPageProps) {
  const healthCheck = useHealthCheck();
  const { triggerAuditEvent } = useAuditEvent();

  useEffect(() => {
    void triggerAuditEvent({
      eventType: AuditEventType.UrgentLowBloodPressure,
      healthCheck: healthCheck.data,
      patientId
    });
  }, [healthCheck?.data]);

  if (healthCheck.isPending) {
    return <Spinner />;
  }
  if (healthCheck.isError) {
    return <Redirecting />;
  }
  return (
    <>
      <Card>
        <Card.Content>
          <Card.Heading headingLevel="H1">
            You cannot complete your NHS Health Check online
          </Card.Heading>
        </Card.Content>
      </Card>
      <p>
        You have told us your blood pressure is{' '}
        {healthCheck.data?.questionnaire.bloodPressureSystolic +
          '/' +
          healthCheck.data?.questionnaire.bloodPressureDiastolic}
        . This is low.
      </p>
      <p>
        You also have symptoms of fainting and dizziness. This means you need to
        seek medical advice.
      </p>
      <p>
        Blood pressure can be naturally low for some people. But sometimes it
        can be caused by illness, a health condition or some medicines.
      </p>
      <Details>
        <Details.Summary>
          Understanding your blood pressure reading
        </Details.Summary>
        <Details.Text>
          <ul>
            <li>Low blood pressure ranges from 70/40 to 89/59</li>
            <li>Healthy blood pressure ranges from 90/60 to 120/80</li>
            <li>Slightly raised blood pressure ranges from 121/81 to 134/84</li>
            <li>High blood pressure ranges from 135/85 to 169/99</li>
          </ul>
        </Details.Text>
      </Details>
      <div className="nhsuk-card nhsuk-card--care nhsuk-card--care--urgent">
        <div className="nhsuk-card--care__heading-container">
          <h2
            className="nhsuk-card--care__heading"
            aria-label="Call one one one if:"
          >
            Call <OneOneOneNumber /> if:
          </h2>
          <span className="nhsuk-card--care__arrow" aria-hidden="true"></span>
        </div>

        <div className="nhsuk-card__content">
          <ul>
            <li>you have symptoms of fainting and dizziness</li>
          </ul>

          <p>
            <PhoneAnchor
              phoneNumber="111"
              phoneNumberForScreenReaders="one one one"
              displayText="Call 111"
            ></PhoneAnchor>
          </p>
          <p>
            Or get advice on the{' '}
            <OpensInNewTabLink
              linkHref="https://111.nhs.uk/"
              linkText="111 website"
              includeNewTabMessage={true}
            />
          </p>
        </div>
      </div>
      <p>
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/conditions/low-blood-pressure-hypotension/"
          linkText="Read NHS guidance on low blood pressure"
          includeNewTabMessage={true}
        />
      </p>
    </>
  );
}
