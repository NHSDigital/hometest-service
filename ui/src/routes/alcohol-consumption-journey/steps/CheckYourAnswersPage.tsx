import { SummaryList } from 'nhsuk-react-components';
import {
  type IAlcoholConsumption,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { EventAuditButton } from '../../../lib/components/event-audit-button';
import AlcoholConsumptionSummaryRows from './alcohol-consumption-summary-rows';

interface CheckYourAnswersPageProps {
  healthCheckAnswers: IAlcoholConsumption;
  healthCheck?: IHealthCheck;
  patientId: string;
  auditScore: number;
  submitAnswers: () => Promise<boolean | void>;
}

export default function CheckYourAnswersPage({
  healthCheckAnswers,
  submitAnswers,
  healthCheck,
  patientId,
  auditScore
}: Readonly<CheckYourAnswersPageProps>) {
  return (
    <>
      <h1>Check your answers</h1>
      <SummaryList>
        <AlcoholConsumptionSummaryRows
          alcoholConsumptionAnswers={healthCheckAnswers}
          auditScore={auditScore}
        />
      </SummaryList>
      <EventAuditButton
        onClick={submitAnswers}
        auditEvents={[
          {
            eventType: AuditEventType.SectionCompleteAlcoholConsumption,
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
