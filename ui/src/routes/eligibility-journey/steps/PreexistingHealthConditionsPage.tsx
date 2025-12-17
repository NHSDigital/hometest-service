import { Radios, InsetText, ErrorSummary } from 'nhsuk-react-components';
import {
  type IEligibility,
  type IHealthCheck,
  AuditEventType
} from '@dnhc-health-checks/shared';
import { useState } from 'react';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { useAuditEvent } from '../../../hooks/eventAuditHook';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';

interface PreexistingHealthConditionsPageProps {
  healthCheckAnswers: IEligibility;
  updateHealthCheckAnswers: (value: Partial<IEligibility>) => Promise<void>;
  healthCheck?: IHealthCheck;
  patientId: string;
}

export default function PreexistingHealthConditionsPage({
  healthCheckAnswers,
  updateHealthCheckAnswers,
  healthCheck,
  patientId
}: Readonly<PreexistingHealthConditionsPageProps>) {
  const error =
    'Select if you have have one or more of these pre-existing conditions';

  const [hasPreExistingCondition, setHasPreExistingCondition] = useState<
    boolean | null | undefined
  >(healthCheckAnswers.hasPreExistingCondition);
  const [errorsPresent, setErrorsPresent] = useState<boolean>(false);
  const { setIsPageInError } = usePageTitleContext();
  const { triggerAuditEvent } = useAuditEvent();

  const isValid = (): boolean => {
    return hasPreExistingCondition !== null;
  };

  const handleNext = async (): Promise<SubmitValidationResult> => {
    if (!isValid()) {
      setErrorsPresent(true);
      setIsPageInError(true);
      return {
        isSubmitValid: false
      };
    }
    await updateHealthCheckAnswers({
      hasPreExistingCondition: hasPreExistingCondition
    });
    if (hasPreExistingCondition === true) {
      void triggerAuditEvent({
        eventType: AuditEventType.PatientIneligibleHasExistingConditions,
        healthCheck,
        patientId
      });
    } else if (hasPreExistingCondition === false) {
      void triggerAuditEvent({
        eventType: AuditEventType.PatientNoExistingConditions,
        healthCheck,
        patientId
      });
    }
    return {
      isSubmitValid: !hasPreExistingCondition
    };
  };

  function onPreExistingConditionsChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setHasPreExistingCondition(e.target.value === 'true');
  }

  return (
    <>
      {errorsPresent && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              {errorsPresent && (
                <ErrorSummary.Item href="#yes">{error}</ErrorSummary.Item>
              )}
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <div>
        <h1>Pre-existing health conditions</h1>
        <p>
          The NHS Health Check is for patients who do not have certain
          pre-existing medical conditions. These conditions include:
        </p>
        <InsetText>
          <ul>
            <li>heart disease</li>
            <li>chronic kidney disease</li>
            <li>diabetes</li>
            <li>high blood pressure (hypertension)</li>
            <li>atrial fibrillation </li>
            <li>transient ischaemic attack</li>
            <li>inherited high cholesterol (familial hypercholesterolemia)</li>
            <li>heart failure</li>
            <li>peripheral arterial disease</li>
            <li>stroke</li>
            <li>
              currently being prescribed statins to lower cholesterol, or
              medicine for high blood pressure
            </li>
            <li>
              previous checks have found that you have a 20% or higher risk of
              getting cardiovascular disease over the next 10 years
            </li>
          </ul>
        </InsetText>
      </div>
      <RadiosWrapper
        legend={'Do you have one or more of these pre-existing conditions?'}
        legendProps={{
          size: 'm'
        }}
        id="preexisting-condition"
        error={errorsPresent ? error : ''}
        onChange={onPreExistingConditionsChange}
      >
        <Radios.Radio
          id="yes"
          value="true"
          checked={hasPreExistingCondition === true}
        >
          Yes
        </Radios.Radio>
        <Radios.Radio
          id="no"
          value="false"
          checked={hasPreExistingCondition === false}
        >
          No
        </Radios.Radio>
      </RadiosWrapper>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
