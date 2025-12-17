import {
  AuditEventType,
  type IEligibility,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { ErrorSummary, Radios } from 'nhsuk-react-components';
import { useState } from 'react';
import { useAuditEvent } from '../../../hooks/eventAuditHook';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';

export interface ReceivedInvitationQueryPageProps {
  healthCheckAnswers: IEligibility;
  updateHealthCheckAnswers: (value: Partial<IEligibility>) => Promise<void>;
  healthCheck?: IHealthCheck;
  patientId: string;
}

export default function ReceivedInvitationQueryPage({
  healthCheckAnswers,
  updateHealthCheckAnswers,
  healthCheck,
  patientId
}: Readonly<ReceivedInvitationQueryPageProps>) {
  const error =
    'Select if you have received an invitation from your GP surgery to do the Health Check online';

  const [hasReceivedAnInvitation, setHasReceivedAnInvitation] = useState<
    boolean | null | undefined
  >(healthCheckAnswers.hasReceivedAnInvitation);
  const [errorsPresent, setErrorsPresent] = useState<boolean>(false);
  const { setIsPageInError } = usePageTitleContext();
  const { triggerAuditEvent } = useAuditEvent();

  const isValid = (): boolean => {
    return hasReceivedAnInvitation !== null;
  };

  const handleNext = async (): Promise<SubmitValidationResult> => {
    if (!isValid()) {
      setErrorsPresent(true);
      setIsPageInError(true);
      return {
        isSubmitValid: false
      };
    }

    try {
      await updateHealthCheckAnswers({
        hasReceivedAnInvitation: hasReceivedAnInvitation
      });

      const eventType = hasReceivedAnInvitation
        ? AuditEventType.PatientInvited
        : AuditEventType.PatientNotInvited;
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

  function onReceivedInvitationChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHasReceivedAnInvitation(e.target.value === 'true');
  }

  return (
    <>
      {errorsPresent && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              {errorsPresent && (
                <ErrorSummary.Item href="#has-been-invited-1">
                  {error}
                </ErrorSummary.Item>
              )}
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}

      <RadiosWrapper
        legend={
          'Did you receive an invitation from your GP surgery to do the NHS Health Check online?'
        }
        legendProps={{
          isPageHeading: true
        }}
        id="has-been-invited"
        error={errorsPresent ? error : ''}
        onChange={onReceivedInvitationChange}
      >
        <Radios.Radio value="true" checked={hasReceivedAnInvitation === true}>
          Yes
        </Radios.Radio>
        <Radios.Radio value="false" checked={hasReceivedAnInvitation === false}>
          No
        </Radios.Radio>
      </RadiosWrapper>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
