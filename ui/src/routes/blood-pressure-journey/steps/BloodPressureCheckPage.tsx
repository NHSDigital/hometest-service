import { Link } from 'react-router-dom';
import { OpensInNewTabLink } from '../../../lib/components/opens-in-new-tab-link';
import {
  AuditEventType,
  type IBloodPressure,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import {
  JourneyStepNames,
  RoutePath,
  getStepUrl
} from '../../../lib/models/route-paths';
import { useAuditEvent } from '../../../hooks/eventAuditHook';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';

interface BloodPressureCheckPageProps {
  readonly healthCheck?: IHealthCheck;
  readonly patientId: string;
  readonly updateHealthCheckAnswers: (
    value: Partial<IBloodPressure>
  ) => Promise<void>;
}

export default function BloodPressureCheckPage({
  healthCheck,
  patientId,
  updateHealthCheckAnswers
}: BloodPressureCheckPageProps) {
  const { triggerAuditEvent } = useAuditEvent();

  const emitEvent = (eventType: AuditEventType) => {
    void triggerAuditEvent({
      eventType,
      healthCheck,
      patientId
    });
  };

  const handleNext = async (): Promise<SubmitValidationResult> => {
    await updateHealthCheckAnswers({});
    return {
      isSubmitValid: true
    };
  };

  return (
    <>
      <h1>Check your blood pressure</h1>
      <p>
        We need your blood pressure reading to help calculate your risk of
        developing heart disease.
      </p>
      <p>
        You can get a free blood pressure reading at a clinic or pharmacy. You
        can also check your blood pressure with a monitor at home.
      </p>
      <p>
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/nhs-services/pharmacies/find-a-pharmacy-that-offers-free-blood-pressure-checks/"
          linkText="Find a pharmacy that offers free blood pressure checks"
          auditEventTriggeredOnClick={{
            eventType: AuditEventType.PharmacySearchOpened,
            healthCheck: healthCheck,
            patientId: patientId
          }}
        />
      </p>
      <p>
        <Link
          to={getStepUrl(
            RoutePath.BloodPressureJourney,
            JourneyStepNames.NeedBloodPressurePage
          )}
          onClick={() => emitEvent(AuditEventType.BloodPressureReadingDeclined)}
        >
          I cannot take my blood pressure reading
        </Link>
      </p>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
