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

interface HoursWalkedPageProps {
  healthCheckAnswers: IPhysicalActivity;
  updateHealthCheckAnswers: (value: IPhysicalActivity) => Promise<void>;
}

export default function HoursWalkedPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<HoursWalkedPageProps>) {
  const errorMessage = 'Select how many hours you walked last week';
  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const [walkHours, setWalkHours] = useState<string>(
    healthCheckAnswers.walkHours ?? ''
  );

  const isValid = (): boolean => {
    return walkHours !== '';
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
      walkHours: walkHours
    } as IPhysicalActivity);
    return {
      isSubmitValid: true
    };
  };

  function onWalkHoursChange(e: React.ChangeEvent<HTMLInputElement>) {
    setWalkHours(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#walk-hours-1">
                {error}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}

      <RadiosWrapper
        legend={'How many hours do you walk in a typical week?'}
        legendProps={{
          isPageHeading: true
        }}
        hint={
          'This includes walking to work, running errands or walking for pleasure'
        }
        id="walk-hours"
        onChange={onWalkHoursChange}
        error={error}
      >
        {Object.values(ExerciseHours).map((item) => {
          return (
            <Radios.Radio
              key={item}
              name="walk-hours"
              value={item}
              checked={walkHours === (item as string)}
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
