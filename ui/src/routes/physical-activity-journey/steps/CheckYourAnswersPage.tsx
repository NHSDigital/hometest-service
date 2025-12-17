import { SummaryList } from 'nhsuk-react-components';
import {
  type IPhysicalActivity,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { EventAuditButton } from '../../../lib/components/event-audit-button';
import getPhysicalActivitySummaryRows from './physical-activity-summary-rows';

interface CheckYourAnswersPageProps {
  healthCheckAnswers: IPhysicalActivity;
  healthCheck?: IHealthCheck;
  patientId: string;
  submitAnswers: () => Promise<boolean | void>;
}

export default function CheckYourAnswersPage({
  healthCheckAnswers,
  healthCheck,
  patientId,
  submitAnswers
}: Readonly<CheckYourAnswersPageProps>) {
  const { PhysicalActivitySummaryRows, PhysicalActivityOptionalSummaryRows } =
    getPhysicalActivitySummaryRows({
      physicalActivityAnswers: healthCheckAnswers
    });

  return (
    <>
      <h1>Check your answers</h1>
      <SummaryList>{PhysicalActivitySummaryRows}</SummaryList>
      <h3>Everyday movement</h3>
      <SummaryList>{PhysicalActivityOptionalSummaryRows}</SummaryList>
      <EventAuditButton
        onClick={submitAnswers}
        auditEvents={[
          {
            eventType: AuditEventType.SectionCompletePhysicalActivity,
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
