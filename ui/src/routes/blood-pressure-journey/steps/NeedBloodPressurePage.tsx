import { Card } from 'nhsuk-react-components';
import { OpensInNewTabLink } from '../../../lib/components/opens-in-new-tab-link';
import { AuditEventType, type IHealthCheck } from '@dnhc-health-checks/shared';
import { GiveFeedbackSection } from '../../../lib/components/give-feedback-section';

interface NeedBloodPressurePageProps {
  healthCheck?: IHealthCheck;
  patientId: string;
}

export default function NeedBloodPressurePage({
  healthCheck,
  patientId
}: NeedBloodPressurePageProps) {
  return (
    <>
      <Card>
        <Card.Content>
          <Card.Heading headingLevel="h1">
            We need your blood pressure reading to continue
          </Card.Heading>
        </Card.Content>
      </Card>
      <div>
        <p>
          To complete your NHS Health Check online we need your blood pressure
          reading.
        </p>
        <p>
          You can search online for a pharmacy that offers free blood pressure
          checks.
        </p>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/nhs-services/pharmacies/find-a-pharmacy-that-offers-free-blood-pressure-checks/"
            linkText="Find a pharmacy that offers free blood pressure checks"
            auditEventTriggeredOnClick={{
              eventType: AuditEventType.PharmacySearchOpened,
              healthCheck,
              patientId: patientId
            }}
          />
        </p>
        <p>
          If you would prefer to complete your NHS Health Check in person with
          your GP, contact your surgery and make an appointment.
        </p>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/conditions/high-blood-pressure-hypertension/"
            linkText="Read NHS guidance about high blood pressure"
          />
        </p>
      </div>
      <GiveFeedbackSection healthCheck={healthCheck} patientId={patientId} />
    </>
  );
}
