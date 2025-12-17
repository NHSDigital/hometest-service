import { SummaryList } from 'nhsuk-react-components';
import {
  type IBloodPressure,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { EventAuditButton } from '../../../lib/components/event-audit-button';
import BloodPressureSummaryRows from './blood-pressure-summary-rows';

export interface ConfirmBloodPressurePageProps {
  readonly healthCheckAnswers: IBloodPressure;
  readonly submitAnswers: () => Promise<boolean | void>;
  readonly healthCheck?: IHealthCheck;
  readonly patientId: string;
}

export default function ConfirmBloodPressurePage({
  healthCheckAnswers,
  submitAnswers,
  healthCheck,
  patientId
}: ConfirmBloodPressurePageProps) {
  return (
    <>
      <h1>Check your answers</h1>
      <SummaryList>
        <BloodPressureSummaryRows bloodPressureAnswers={healthCheckAnswers} />
      </SummaryList>
      <EventAuditButton
        onClick={submitAnswers}
        auditEvents={[
          {
            eventType: AuditEventType.SectionCompleteBloodPressure,
            healthCheck,
            patientId,
            details: { bpTakenAt: healthCheckAnswers.bloodPressureLocation }
          }
        ]}
      >
        Save and continue
      </EventAuditButton>
    </>
  );
}
