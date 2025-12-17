import { ErrorSummary, Radios } from 'nhsuk-react-components';
import {
  ExerciseHours,
  type IPhysicalActivity
} from '@dnhc-health-checks/shared';
import { useState } from 'react';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface HoursCycledPageProps {
  healthCheckAnswers: IPhysicalActivity;
  updateHealthCheckAnswers: (
    value: Partial<IPhysicalActivity>
  ) => Promise<void>;
}

export default function HoursCycledPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<HoursCycledPageProps>) {
  const errorMessage = 'Select how many hours you cycled last week';

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const [cycleHours, setCycleHours] = useState<string>(
    healthCheckAnswers.cycleHours ?? ''
  );

  const isValid = (): boolean => {
    return cycleHours !== '';
  };

  const handleNext = async (): Promise<SubmitValidationResult> => {
    if (!isValid()) {
      setError(errorMessage);
      setIsPageInError(true);
      return {
        isSubmitValid: false
      };
    }

    await updateHealthCheckAnswers({
      cycleHours
    } as IPhysicalActivity);
    return {
      isSubmitValid: true
    };
  };

  function onCycleHoursChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCycleHours(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#cycle-hours-1">
                {error}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={'How many hours do you cycle in a typical week?'}
        legendProps={{
          isPageHeading: true
        }}
        id="cycle-hours"
        hint={'This includes commuting and cycling for pleasure'}
        onChange={onCycleHoursChange}
        error={error}
      >
        {Object.values(ExerciseHours).map((item) => {
          return (
            <Radios.Radio
              key={item}
              name="cycle-hours"
              value={item}
              checked={cycleHours === (item as string)}
            >
              {EnumDescriptions.ExerciseHours[item]}
            </Radios.Radio>
          );
        })}
      </RadiosWrapper>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
