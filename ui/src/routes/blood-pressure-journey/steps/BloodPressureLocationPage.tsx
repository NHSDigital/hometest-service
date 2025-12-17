import { Radios, ErrorSummary } from 'nhsuk-react-components';
import {
  BloodPressureLocation,
  type IBloodPressure
} from '@dnhc-health-checks/shared';
import { useState } from 'react';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface BloodPressureLocationPageProps {
  healthCheckAnswers: IBloodPressure;
  updateHealthCheckAnswers: (value: Partial<IBloodPressure>) => Promise<void>;
}

export default function BloodPressureLocationPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: BloodPressureLocationPageProps) {
  const error = 'Select how you will take your blood pressure reading';

  const [errorsPresent, setErrorsPresent] = useState<boolean>(false);
  const { setIsPageInError } = usePageTitleContext();

  const [bloodPressureLocation, setBloodPressureLocation] = useState<string>(
    healthCheckAnswers.bloodPressureLocation ?? ''
  );

  const isValid = (): boolean => {
    return bloodPressureLocation !== '';
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
      bloodPressureLocation
    } as IBloodPressure);
    return {
      isSubmitValid: true
    };
  };

  function onLocationChange(e: React.ChangeEvent<HTMLInputElement>) {
    setBloodPressureLocation(e.target.value);
  }

  return (
    <>
      {errorsPresent && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#location-1">{error}</ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <h1>Confirm where you will get a blood pressure reading</h1>
      <p>
        It is important for us to know how you had your reading done. This is
        because it affects how we calculate your NHS Health Check results.
      </p>
      <RadiosWrapper
        legend={'How will you take your reading?'}
        legendProps={{
          size: 'm'
        }}
        id="location"
        onChange={onLocationChange}
        error={errorsPresent ? error : ''}
      >
        {Object.values(BloodPressureLocation).map((item) => {
          return (
            <Radios.Radio
              key={item}
              name="location"
              value={item}
              checked={
                (bloodPressureLocation as BloodPressureLocation) === item
              }
            >
              {EnumDescriptions.BloodPressureLocation[item]}
            </Radios.Radio>
          );
        })}
      </RadiosWrapper>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
