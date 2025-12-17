import {
  type IBloodPressure,
  ConfirmBloodPressureReading,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { bloodPressureChecker } from '../blood-pressure-checker';
import { useAuditEvent } from '../../../hooks/eventAuditHook';
import RadiosConfirm from '../../../lib/components/radios-confirm';

interface ConfirmBloodPressureReadingProps {
  healthCheckAnswers: IBloodPressure;
  healthCheck?: IHealthCheck;
  patientId: string;
  updateHealthCheckAnswers: (value: Partial<IBloodPressure>) => Promise<void>;
}
export default function ConfirmBloodPressureReadingPage({
  healthCheckAnswers,
  healthCheck,
  patientId,
  updateHealthCheckAnswers
}: Readonly<ConfirmBloodPressureReadingProps>) {
  const errorMessage = 'Select yes if your blood pressure reading is correct';
  const title = `You told us your blood pressure reading is ${healthCheckAnswers.bloodPressureSystolic}/${healthCheckAnswers.bloodPressureDiastolic}. Is this correct?`;
  const isHighBloodPressure =
    bloodPressureChecker.isBloodPressureVeryHigh(healthCheckAnswers);
  const { triggerAuditEvent } = useAuditEvent();

  async function handleNext(
    bloodPressureValuesConfirmed: boolean
  ): Promise<void> {
    if (isHighBloodPressure) {
      await updateHealthCheckAnswers({
        highBloodPressureValuesConfirmed: bloodPressureValuesConfirmed,
        lowBloodPressureValuesConfirmed: null
      });
    } else {
      await updateHealthCheckAnswers({
        lowBloodPressureValuesConfirmed: bloodPressureValuesConfirmed,
        highBloodPressureValuesConfirmed: null
      });
    }

    void triggerAuditEvent({
      eventType: AuditEventType.BloodPressureConfirmation,
      healthCheck,
      patientId,
      details: {
        bpConfirmed: bloodPressureValuesConfirmed ? 'Yes' : 'No'
      }
    });
  }

  return (
    <RadiosConfirm
      errorMessage={errorMessage}
      titleOfRadio={title}
      initialValue={
        isHighBloodPressure
          ? (healthCheckAnswers.highBloodPressureValuesConfirmed ?? null)
          : (healthCheckAnswers.lowBloodPressureValuesConfirmed ?? null)
      }
      idOfRadioParent={'confirm-blood-pressure'}
      booleanTexts={{
        isTrue: ConfirmBloodPressureReading.CorrectLowBloodPressure,
        isFalse: ConfirmBloodPressureReading.IncorrectLowBloodPressure
      }}
      onContinue={handleNext}
    />
  );
}
