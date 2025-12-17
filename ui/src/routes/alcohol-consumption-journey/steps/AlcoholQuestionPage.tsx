import { ErrorSummary, Radios } from 'nhsuk-react-components';
import {
  type IAlcoholConsumption,
  DoYouDrinkAlcohol
} from '@dnhc-health-checks/shared';
import { useState } from 'react';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface AlcoholQuestionPageProps {
  healthCheckAnswers: IAlcoholConsumption;
  updateHealthCheckAnswers: (value: IAlcoholConsumption) => Promise<void>;
}

export default function AlcoholQuestionPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<AlcoholQuestionPageProps>) {
  const errorMessage = 'Select if you drink alcohol';

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const [doYouDrinkAlcohol, setDoYouDrinkAlcohol] = useState<string>(
    healthCheckAnswers.drinkAlcohol ?? ''
  );

  const isValid = (): boolean => {
    return doYouDrinkAlcohol !== '';
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
      drinkAlcohol: doYouDrinkAlcohol
    } as IAlcoholConsumption);
    return {
      isSubmitValid: true
    };
  };

  function onDoYouDrinkAlcoholChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDoYouDrinkAlcohol(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#drink-alcohol-1">
                {error}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={'Do you drink alcohol?'}
        legendProps={{
          isPageHeading: true
        }}
        id="drink-alcohol"
        onChange={onDoYouDrinkAlcoholChange}
        error={error}
      >
        {Object.values(DoYouDrinkAlcohol).map((item) => {
          return (
            <Radios.Radio
              key={item}
              name="drink-alcohol"
              value={item}
              checked={(doYouDrinkAlcohol as DoYouDrinkAlcohol) === item}
            >
              {EnumDescriptions.DoYouDrinkAlcohol[item]}
            </Radios.Radio>
          );
        })}
      </RadiosWrapper>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
