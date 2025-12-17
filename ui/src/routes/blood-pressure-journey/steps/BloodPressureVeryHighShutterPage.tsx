import { InsetText, Card } from 'nhsuk-react-components';
import { useEffect } from 'react';
import {
  type IBloodPressure,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { OneOneOneNumber } from '../../../lib/components/one-one-one-number';
import { OpensInNewTabLink } from '../../../lib/components/opens-in-new-tab-link';
import { useAuditEvent } from '../../../hooks/eventAuditHook';

interface BloodPressureVeryHighPageProps {
  healthCheckAnswers: IBloodPressure;
  healthCheck?: IHealthCheck;
  patientId: string;
}

export default function BloodPressureVeryHighShutterPage({
  healthCheckAnswers,
  healthCheck,
  patientId
}: Readonly<BloodPressureVeryHighPageProps>) {
  const { triggerAuditEvent } = useAuditEvent();

  useEffect(() => {
    void triggerAuditEvent({
      eventType: AuditEventType.UrgentHighBloodPressure,
      healthCheck,
      patientId
    });
  }, []);

  return (
    <>
      <Card>
        <Card.Content>
          <Card.Heading headingLevel="h1" className="nhsuk-u-font-size-24">
            Your blood pressure reading is:{' '}
            <span className="app-card__heading-big-number">
              {healthCheckAnswers.bloodPressureSystolic}/
              {healthCheckAnswers.bloodPressureDiastolic}
            </span>
          </Card.Heading>
          <InsetText className="app-inset-text--red nhsuk-u-margin-top-0">
            <p>This is very high blood pressure.</p>
          </InsetText>
        </Card.Content>
      </Card>

      <p>
        If you&apos;re currently being treated for high blood pressure follow
        your doctor&apos;s advice. If you did not get any advice, contact your
        doctor.
      </p>

      <Card cardType="urgent">
        <Card.Heading>Ask for an urgent GP appointment if:</Card.Heading>
        <Card.Content>
          <ul>
            <li>you are not currently being treated for high blood pressure</li>
          </ul>
          <p>
            If you cannot get an appointment today, call{' '}
            <a href="tel:111" aria-label="one one one">
              111
            </a>
            {''}. They will tell you what to do and can arrange a phone call
            from a nurse or doctor if you need one.
          </p>
          <p>
            <a href="tel:111" aria-label="Call one one one">
              Call 111
            </a>
          </p>
          <p>
            Do not use <OneOneOneNumber /> online. They cannot help with very
            high blood pressure readings.
          </p>
        </Card.Content>
      </Card>

      <Card cardType="emergency">
        <Card.Heading>Call 999 or go to A&amp;E now if:</Card.Heading>
        <Card.Content>
          <p>You are experiencing symptoms such as:</p>
          <ul>
            <li>confusion</li>
            <li>blurry vision</li>
            <li>chest pains</li>
            <li>a fast, irregular or pounding heartbeat</li>
            <li>breathlessness</li>
            <li>peeing less than normal</li>
            <li>nausea or vomiting</li>
          </ul>
          <p>
            <OpensInNewTabLink
              linkHref="https://www.nhs.uk/service-search/find-an-accident-and-emergency-service/"
              linkText="Find your nearest A&amp;E"
              includeNewTabMessage={true}
            />
          </p>
        </Card.Content>
      </Card>
      <p>
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/conditions/high-blood-pressure-hypertension/treatment/"
          linkText="Read about treatment for high blood pressure"
          includeNewTabMessage={true}
        />
      </p>
    </>
  );
}
