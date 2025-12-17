import { Button } from 'nhsuk-react-components';
import { Link } from 'react-router-dom';
import { AuditEventType, type IHealthCheck } from '@dnhc-health-checks/shared';
import {
  getStepUrl,
  JourneyStepNames,
  RoutePath
} from '../../../lib/models/route-paths';
import { useAuditEvent } from '../../../hooks/eventAuditHook';
import { ImportantCallout } from '../../../lib/components/important-callout';
import { LEICESTER_RISK_SCORE_THRESHOLD } from '../../body-measurements-journey/BodyMeasurementsStepManager';
import { noLabResultAutoExpireAfterDays } from '../../../settings';
import { convertToFormattedExpiryDate } from '../../../lib/converters/expiry-date-converter';
import { NotificationBannerComponent } from '../../../lib/components/notification-banner';

interface BloodTestDeclarationPageProps {
  showSubmittedBanner: boolean;
  onContinue: () => void;
  healthCheck: IHealthCheck;
  patientId: string;
}

export function BloodTestDeclarationPage({
  showSubmittedBanner,
  onContinue,
  healthCheck,
  patientId
}: BloodTestDeclarationPageProps) {
  const { triggerAuditEvent } = useAuditEvent();
  const formattedExpiryDate = convertToFormattedExpiryDate(
    healthCheck.questionnaireCompletionDate,
    noLabResultAutoExpireAfterDays
  );

  const emitEvent = (eventType: AuditEventType) => {
    void triggerAuditEvent({
      eventType,
      healthCheck,
      patientId
    });
  };

  const cholesterolAndHba1cTestRequired = () =>
    (healthCheck?.questionnaireScores?.leicesterRiskScore ?? 0) >=
    LEICESTER_RISK_SCORE_THRESHOLD;

  return (
    <>
      {showSubmittedBanner && (
        <NotificationBannerComponent
          title="Success"
          content={"Answers submitted. There's one more thing you need to do."}
          success={true}
        />
      )}
      <h1>Order a blood test kit</h1>

      <p>
        To get your Health Check results, the final step is to complete a
        finger-prick blood test at home.
      </p>

      <p>
        We’ll send you a free kit by post, with full instructions and support.
      </p>

      {cholesterolAndHba1cTestRequired() ? (
        <>
          <p>
            There are two tests in the kit. Complete both and post them back
            free of charge for analysis.
          </p>

          <ImportantCallout>
            <p>
              {`Post your tests back as soon as you can. We need to have the analysis complete by ${formattedExpiryDate}, or your Health Check will expire.`}
            </p>
          </ImportantCallout>
        </>
      ) : (
        <>
          <p>Complete the test and post it back free of charge for analysis.</p>

          <ImportantCallout>
            <p>
              {`Post your test back as soon as you can. We need to have the analysis complete by ${formattedExpiryDate}, or your Health Check will expire.`}
            </p>
          </ImportantCallout>
        </>
      )}

      <Button onClick={onContinue}>Order a blood test kit</Button>
      <p>
        <Link
          to={getStepUrl(
            RoutePath.BloodTestJourney,
            JourneyStepNames.NeedBloodTestPage
          )}
          onClick={() => emitEvent(AuditEventType.BloodTestDeclined)}
        >
          I do not want to do a blood test at home
        </Link>
      </p>
    </>
  );
}
