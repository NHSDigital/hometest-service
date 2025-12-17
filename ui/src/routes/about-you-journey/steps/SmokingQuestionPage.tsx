import { ErrorSummary, Radios } from 'nhsuk-react-components';
import { type IAboutYou, Smoking } from '@dnhc-health-checks/shared';
import React, { useState } from 'react';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface SmokingQuestionPageProps {
  healthCheckAnswers: IAboutYou;
  updateHealthCheckAnswers: (value: Partial<IAboutYou>) => Promise<void>;
}

export default function SmokingQuestionPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<SmokingQuestionPageProps>) {
  const errorMessage = 'Select if you smoke ';

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const [smoking, setSmoking] = useState<string>(
    healthCheckAnswers.smoking ?? ''
  );

  const isValid = (): boolean => {
    return smoking !== '';
  };

  const handleNext = async (): Promise<SubmitValidationResult> => {
    if (!isValid()) {
      setError(errorMessage);
      setIsPageInError(true);
      return {
        isSubmitValid: false
      };
    }
    await updateHealthCheckAnswers({ smoking: smoking } as IAboutYou);
    return {
      isSubmitValid: true
    };
  };

  function onSmokingChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSmoking(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#smoking-1">{error}</ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={'Do you smoke?'}
        legendProps={{
          isPageHeading: true
        }}
        id="smoking"
        onChange={onSmokingChange}
        error={error}
      >
        {Object.values(Smoking).map((item) => (
          <Radios.Radio
            key={item}
            name="smoking"
            value={item}
            checked={(smoking as Smoking) === item}
          >
            {EnumDescriptions.Smoking[item].description}
          </Radios.Radio>
        ))}
      </RadiosWrapper>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
