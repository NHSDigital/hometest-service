import { SummaryList } from 'nhsuk-react-components';
import {
  type IBodyMeasurements,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { EventAuditButton } from '../../../lib/components/event-audit-button';
import BodyMeasurementsSummaryRows from './BodyMeasurementsSummaryRows';

interface CheckYourAnswersPageProps {
  healthCheckAnswers: IBodyMeasurements;
  healthCheck?: IHealthCheck;
  patientId: string;
  submitAnswers: () => Promise<boolean | void>;
}

export default function CheckYourAnswersPage({
  healthCheckAnswers,
  healthCheck,
  patientId,
  submitAnswers
}: CheckYourAnswersPageProps) {
  return (
    <>
      <h1>Check your answers</h1>
      <SummaryList>
        <BodyMeasurementsSummaryRows
          bodyMeasurementsAnswers={healthCheckAnswers}
        />
      </SummaryList>
      <EventAuditButton
        onClick={submitAnswers}
        auditEvents={[
          {
            eventType: AuditEventType.SectionCompleteBodyMeasurements,
            healthCheck,
            patientId
          }
        ]}
      >
        Save and continue
      </EventAuditButton>
    </>
  );
}
