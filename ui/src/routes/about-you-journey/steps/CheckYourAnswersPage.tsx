import { SummaryList } from 'nhsuk-react-components';
import {
  type IAboutYou,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { EventAuditButton } from '../../../lib/components/event-audit-button';
import AboutYouSummaryRows from './about-you-summary-rows';

interface CheckYourAnswersPageProps {
  healthCheck?: IHealthCheck;
  patientId: string;
  healthCheckAnswers: IAboutYou;
  submitAnswers: () => Promise<boolean | void>;
}

export default function CheckYourAnswersPage({
  healthCheckAnswers,
  healthCheck,
  patientId,
  submitAnswers
}: Readonly<CheckYourAnswersPageProps>) {
  return (
    <>
      <h1>Check your answers</h1>
      <SummaryList>
        <AboutYouSummaryRows aboutYouAnswers={healthCheckAnswers} />
      </SummaryList>
      <EventAuditButton
        onClick={submitAnswers}
        auditEvents={[
          {
            eventType: AuditEventType.SectionCompleteAboutYou,
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
