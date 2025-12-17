import { useState } from 'react';
import { Radios, ErrorSummary } from 'nhsuk-react-components';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import {
  type IEligibility,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { useAuditEvent } from '../../../hooks/eventAuditHook';

export interface PreviousHealthCheckCompletedQueryPageProps {
  healthCheckAnswers: IEligibility;
  updateHealthCheckAnswers: (value: IEligibility) => Promise<void>;
  healthCheck?: IHealthCheck;
  patientId: string;
}

export default function PreviousHealthCheckCompletedQueryPage({
  healthCheckAnswers,
  updateHealthCheckAnswers,
  healthCheck,
  patientId
}: Readonly<PreviousHealthCheckCompletedQueryPageProps>) {
  const errors = {
    preExistingCondition: {
      required:
        'Select yes if you have completed an NHS Health Check in the last 5 years'
    }
  };

  const [hasCompletedPreviousHealthCheck, setHasCompletedPreviousHealthCheck] =
    useState<boolean | null | undefined>(
      healthCheckAnswers.hasCompletedHealthCheckInLast5Years
    );
  const [errorsPresent, setErrorsPresent] = useState<boolean>(false);
  const { setIsPageInError } = usePageTitleContext();
  const { triggerAuditEvent } = useAuditEvent();

  const handleNext = async (): Promise<SubmitValidationResult> => {
    if (hasCompletedPreviousHealthCheck === null) {
      setErrorsPresent(true);
      setIsPageInError(true);
      return {
        isSubmitValid: false
      };
    }

    try {
      await updateHealthCheckAnswers({
        ...healthCheckAnswers,
        hasCompletedHealthCheckInLast5Years: hasCompletedPreviousHealthCheck
      });
      const eventType = hasCompletedPreviousHealthCheck
        ? AuditEventType.PatientIneligibleHealthCheckInLastFiveYears
        : AuditEventType.PatientNotCompletedHealthCheckInLastFiveYears;
      logEvent(eventType);
    } catch {
      setErrorsPresent(true);
      setIsPageInError(true);
      return {
        isSubmitValid: false
      };
    }
    return {
      isSubmitValid: true
    };
  };

  function logEvent(type: AuditEventType) {
    void triggerAuditEvent({
      eventType: type,
      healthCheck,
      patientId
    });
  }

  function onPreviousHealthCheckChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHasCompletedPreviousHealthCheck(e.target.value === 'true');
  }

  return (
    <>
      {errorsPresent && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              {errorsPresent && (
                <ErrorSummary.Item href="#preexisting-condition-1">
                  {errors.preExistingCondition.required}
                </ErrorSummary.Item>
              )}
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}

      <RadiosWrapper
        legend={'Have you completed an NHS Health Check in the last 5 years?'}
        legendProps={{
          isPageHeading: true
        }}
        id="preexisting-condition"
        error={errorsPresent ? errors.preExistingCondition.required : ''}
        onChange={onPreviousHealthCheckChange}
      >
        <Radios.Radio
          value="true"
          checked={hasCompletedPreviousHealthCheck === true}
        >
          Yes
        </Radios.Radio>
        <Radios.Radio
          value="false"
          checked={hasCompletedPreviousHealthCheck === false}
        >
          No
        </Radios.Radio>
      </RadiosWrapper>

      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
