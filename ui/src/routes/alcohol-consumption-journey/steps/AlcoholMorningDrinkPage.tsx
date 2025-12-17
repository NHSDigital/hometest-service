import { ErrorSummary, Radios } from 'nhsuk-react-components';
import {
  AlcoholEventsFrequency,
  type IAlcoholConsumption
} from '@dnhc-health-checks/shared';
import React, { useState } from 'react';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface AlcoholMorningDrinkPageProps {
  healthCheckAnswers: IAlcoholConsumption;
  updateHealthCheckAnswers: (value: IAlcoholConsumption) => Promise<void>;
}

export default function AlcoholMorningDrinkPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: AlcoholMorningDrinkPageProps) {
  const errorMessage =
    "Select how often in the past year you've needed an alcoholic drink in the morning to get going after a heavy drinking session";

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const [alcoholMorningDrink, setAlcoholMorningDrink] = useState<string>(
    healthCheckAnswers.alcoholMorningDrink ?? ''
  );

  const isValid = (): boolean => {
    return alcoholMorningDrink !== '';
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
      alcoholMorningDrink: alcoholMorningDrink
    } as IAlcoholConsumption);
    return {
      isSubmitValid: true
    };
  };

  function onAlcoholMorningDrinkChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAlcoholMorningDrink(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#morning-drink-1">
                {error}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={
          'In the past year, how often have you needed an alcoholic drink in the morning to get going after a heavy drinking session?'
        }
        legendProps={{
          isPageHeading: true
        }}
        id="morning-drink"
        onChange={onAlcoholMorningDrinkChange}
        error={error}
      >
        {Object.values(AlcoholEventsFrequency).map((item) => {
          return (
            <Radios.Radio
              key={item}
              name="morning-drink"
              value={item}
              checked={(alcoholMorningDrink as AlcoholEventsFrequency) === item}
            >
              {EnumDescriptions.AlcoholEventsFrequency[item]}
            </Radios.Radio>
          );
        })}
      </RadiosWrapper>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
