import { ErrorSummary, Radios } from 'nhsuk-react-components';
import {
  AlcoholHowOften,
  type IAlcoholConsumption
} from '@dnhc-health-checks/shared';
import React, { useState } from 'react';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface AlcoholOftenPageProps {
  healthCheckAnswers: IAlcoholConsumption;
  updateHealthCheckAnswers: (value: IAlcoholConsumption) => Promise<void>;
}

export default function AlcoholOftenPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: AlcoholOftenPageProps) {
  const errorMessage = 'Select how often you have a drink containing alcohol';

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const [alcoholHowOften, setAlcoholHowOften] = useState<string>(
    healthCheckAnswers.alcoholHowOften ?? ''
  );

  const isValid = (): boolean => {
    return alcoholHowOften !== '';
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
      alcoholHowOften: alcoholHowOften
    } as IAlcoholConsumption);
    return {
      isSubmitValid: true
    };
  };

  function onAlcoholHowOftenChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAlcoholHowOften(e.target.value);
  }
  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#alcohol-how-often-1">
                {error}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={'How often do you have a drink containing alcohol?'}
        legendProps={{
          isPageHeading: true
        }}
        id="alcohol-how-often"
        onChange={onAlcoholHowOftenChange}
        error={error}
      >
        {Object.values(AlcoholHowOften).map((item) => {
          return (
            <Radios.Radio
              key={item}
              name="how-often"
              value={item}
              checked={(alcoholHowOften as AlcoholHowOften) === item}
            >
              {EnumDescriptions.AlcoholHowOften[item]}
            </Radios.Radio>
          );
        })}
      </RadiosWrapper>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
