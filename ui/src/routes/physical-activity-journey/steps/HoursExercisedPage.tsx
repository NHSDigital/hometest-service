import { ErrorSummary, Radios } from 'nhsuk-react-components';
import { useState } from 'react';
import {
  ExerciseHours,
  type IPhysicalActivity
} from '@dnhc-health-checks/shared';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface HoursExercisedPageProps {
  healthCheckAnswers: IPhysicalActivity;
  updateHealthCheckAnswers: (
    value: Partial<IPhysicalActivity>
  ) => Promise<void>;
}

export default function HoursExercisedPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<HoursExercisedPageProps>) {
  const errorMessage = 'Select how many hours you exercised last week';

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const [exerciseHours, setExerciseHours] = useState<string>(
    healthCheckAnswers.exerciseHours ?? ''
  );

  const isValid = (): boolean => {
    return exerciseHours !== '';
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
      exerciseHours: exerciseHours
    } as IPhysicalActivity);
    return {
      isSubmitValid: true
    };
  };

  function onExerciseHoursChange(e: React.ChangeEvent<HTMLInputElement>) {
    setExerciseHours(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#exercise-hours-1">
                {error}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={'How many hours do you exercise in a typical week?'}
        legendProps={{
          isPageHeading: true
        }}
        id="exercise-hours"
        onChange={onExerciseHoursChange}
        error={error}
      >
        <span className="nhsuk-hint">
          <p>
            For example, swimming, jogging, aerobics, football, tennis or weight
            training.
          </p>
          <p>
            Do not include cycling or walking. We will ask about these
            separately.
          </p>
        </span>

        {Object.values(ExerciseHours).map((item) => {
          return (
            <Radios.Radio
              key={item}
              name="exercise-hours"
              value={item}
              checked={exerciseHours === (item as string)}
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
