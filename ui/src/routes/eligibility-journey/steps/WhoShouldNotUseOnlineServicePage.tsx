import { useState } from 'react';
import {
  type IEligibility,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { ErrorSummary, InsetText, Radios } from 'nhsuk-react-components';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import { useAuditEvent } from '../../../hooks/eventAuditHook';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';

export interface WhoShouldNotUseOnlineServicePageProps {
  healthCheckAnswers: IEligibility;
  updateHealthCheckAnswers: (value: IEligibility) => Promise<void>;
  healthCheck?: IHealthCheck;
  patientId: string;
}

export default function WhoShouldNotUseOnlineServicePage({
  healthCheckAnswers,
  updateHealthCheckAnswers,
  healthCheck,
  patientId
}: Readonly<WhoShouldNotUseOnlineServicePageProps>) {
  const errors = {
    needToLeaveTheService: {
      required: 'Select yes if you need to leave the online service'
    }
  };

  const [canCompleteHealthCheckOnline, setCanCompleteHealthCheckOnline] =
    useState<boolean | null | undefined>(
      healthCheckAnswers.canCompleteHealthCheckOnline
    );
  const [errorsPresent, setErrorsPresent] = useState<boolean>(false);
  const { setIsPageInError } = usePageTitleContext();
  const { triggerAuditEvent } = useAuditEvent();

  const handleNext = async (): Promise<SubmitValidationResult> => {
    if (canCompleteHealthCheckOnline === null) {
      setErrorsPresent(true);
      setIsPageInError(true);
      return {
        isSubmitValid: false
      };
    }

    try {
      await updateHealthCheckAnswers({
        ...healthCheckAnswers,
        canCompleteHealthCheckOnline: canCompleteHealthCheckOnline
      });
    } catch {
      setErrorsPresent(true);
      setIsPageInError(true);
      return {
        isSubmitValid: false
      };
    }
    if (canCompleteHealthCheckOnline === false) {
      void triggerAuditEvent({
        eventType: AuditEventType.PatientIneligibleExclusions,
        healthCheck,
        patientId
      });
    } else if (canCompleteHealthCheckOnline === true) {
      void triggerAuditEvent({
        eventType: AuditEventType.PatientNoExclusions,
        healthCheck,
        patientId
      });
      void triggerAuditEvent({
        eventType: AuditEventType.SectionCompleteEligibility,
        healthCheck,
        patientId
      });
    }
    return {
      isSubmitValid: true
    };
  };

  function onCanCompleteHealthCheckChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setCanCompleteHealthCheckOnline(e.target.value === 'true');
  }

  return (
    <>
      {errorsPresent && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              {errorsPresent && (
                <ErrorSummary.Item href="#can-complete-health-check-online-1">
                  {errors.needToLeaveTheService.required}
                </ErrorSummary.Item>
              )}
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <div>
        <h1>Who should not use this online service</h1>
        <p>You&apos;ll need to leave the online service if you:</p>

        <InsetText>
          <ul>
            <li>are pregnant</li>
            <li>
              have been diagnosed with an eating disorder, or think you may have
              one
            </li>
            <li>have a condition that affects your height</li>
            <li>
              have had a limb amputation, or were born with a limb difference
            </li>
          </ul>
        </InsetText>
        <p>
          This is because the online service uses automatic calculations. It
          cannot give you accurate results in these cases.
        </p>
        <p>
          Your GP surgery may offer you an NHS Health Check in a face-to-face
          appointment instead.
        </p>
      </div>
      <RadiosWrapper
        legend={
          'Do you need to leave the online service and book an appointment with your GP surgery?'
        }
        legendProps={{
          size: 'm'
        }}
        id="can-complete-health-check-online"
        error={errorsPresent ? errors.needToLeaveTheService.required : ''}
        onChange={onCanCompleteHealthCheckChange}
      >
        <Radios.Radio
          value="false"
          checked={canCompleteHealthCheckOnline === false}
        >
          Yes
        </Radios.Radio>
        <Radios.Radio
          value="true"
          checked={canCompleteHealthCheckOnline === true}
        >
          No
        </Radios.Radio>
      </RadiosWrapper>

      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
