import { ErrorSummary, Radios } from 'nhsuk-react-components';
import {
  type IPhysicalActivity,
  WorkActivity
} from '@dnhc-health-checks/shared';
import { useState } from 'react';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface WorkActivityPageProps {
  healthCheckAnswers: IPhysicalActivity;
  updateHealthCheckAnswers: (value: IPhysicalActivity) => Promise<void>;
}

export default function WorkActivityPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<WorkActivityPageProps>) {
  const errorMessage = 'Select how active you are in your work';

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();
  const [workActivity, setWorkActivity] = useState<string>(
    healthCheckAnswers.workActivity ?? ''
  );

  const isValid = (): boolean => {
    return workActivity !== '';
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
      workActivity: workActivity
    } as IPhysicalActivity);
    return {
      isSubmitValid: true
    };
  };

  function onWorkActivityChange(e: React.ChangeEvent<HTMLInputElement>) {
    setWorkActivity(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#work-activity-1">
                {error}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={'How active are you in your work?'}
        legendProps={{
          isPageHeading: true
        }}
        id="work-activity"
        onChange={onWorkActivityChange}
        error={error}
      >
        {Object.values(WorkActivity).map((item) => (
          <Radios.Radio
            key={item}
            name="activity"
            hint={EnumDescriptions.WorkActivity[item].hint}
            value={item}
            checked={workActivity === String(item)}
          >
            {EnumDescriptions.WorkActivity[item].description}
          </Radios.Radio>
        ))}
      </RadiosWrapper>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
