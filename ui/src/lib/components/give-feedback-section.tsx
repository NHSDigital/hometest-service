import { ButtonLink } from 'nhsuk-react-components';
import { AuditEventType, type IHealthCheck } from '@dnhc-health-checks/shared';
import { giveFeedbackUrl } from '../../settings';
import { useAuditEvent } from '../../hooks/eventAuditHook';

interface GiveFeedbackSectionProps {
  logAuditEvent?: boolean;
  healthCheck?: IHealthCheck;
  patientId?: string;
}

export function GiveFeedbackSection({
  logAuditEvent = true,
  healthCheck,
  patientId
}: Readonly<GiveFeedbackSectionProps>): JSX.Element {
  const { triggerAuditEvent } = useAuditEvent();

  const handleClick = (): void => {
    if (logAuditEvent) {
      void triggerAuditEvent({
        eventType: AuditEventType.UserFeedbackSurveyOpened,
        healthCheck,
        patientId
      });
    }
  };

  return (
    <>
      <h2>Help us improve this service</h2>
      <p>
        Tell us about your experience using this service (opens in new tab).
      </p>
      <ButtonLink
        onClick={handleClick}
        target="_blank"
        href={giveFeedbackUrl}
        rel="noreferrer noopener"
      >
        Give feedback
      </ButtonLink>
    </>
  );
}
