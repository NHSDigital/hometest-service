import {
  type IBloodPressure,
  ConfirmLowBloodPressureSymptoms,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import RadiosConfirm from '../../../../lib/components/radios-confirm';
import { useState } from 'react';
import { useAuditEvent } from '../../../../hooks/eventAuditHook';

interface LowBloodPressureSymptomsProps {
  healthCheckAnswers: IBloodPressure;
  healthCheck?: IHealthCheck;
  patientId: string;
  updateHealthCheckAnswers: (value: Partial<IBloodPressure>) => Promise<void>;
}

export default function LowBloodPressureSymptomsPage({
  healthCheckAnswers,
  healthCheck,
  patientId,
  updateHealthCheckAnswers
}: Readonly<LowBloodPressureSymptomsProps>) {
  const errorMessage =
    'Select yes if you have symptoms of fainting or dizziness';
  const title = 'Do you have symptoms of fainting or dizziness?';
  const hint: string =
    'For example, passing out for short periods of time, feeling lightheaded or off-balance.';
  const [
    hasStrongLowBloodPressureSymptoms,
    setHasStrongLowBloodPressureSymptoms
  ] = useState<boolean | null | undefined>(
    healthCheckAnswers.hasStrongLowBloodPressureSymptoms
  );
  const { triggerAuditEvent } = useAuditEvent();

  async function handleNext(
    hasStrongLowBloodPressureSymptoms: boolean
  ): Promise<void> {
    setHasStrongLowBloodPressureSymptoms(hasStrongLowBloodPressureSymptoms);
    await updateHealthCheckAnswers({ hasStrongLowBloodPressureSymptoms });
    void triggerAuditEvent({
      eventType: AuditEventType.LowBloodPressureSymptoms,
      healthCheck,
      patientId,
      details: {
        bpSymptoms: hasStrongLowBloodPressureSymptoms ? 'Yes' : 'No'
      }
    });
  }

  return (
    <RadiosConfirm
      errorMessage={errorMessage}
      titleOfRadio={title}
      initialValue={hasStrongLowBloodPressureSymptoms ?? null}
      idOfRadioParent={'confirm-low-blood-pressure-symptoms'}
      booleanTexts={{
        isTrue: ConfirmLowBloodPressureSymptoms.Positive,
        isFalse: ConfirmLowBloodPressureSymptoms.Negative
      }}
      onContinue={handleNext}
      hint={hint}
    />
  );
}
