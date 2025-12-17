import { Details, ErrorSummary, Radios } from 'nhsuk-react-components';
import {
  AlcoholDailyUnits,
  type IAlcoholConsumption
} from '@dnhc-health-checks/shared';
import React, { useState } from 'react';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface AlcoholTypicalUnitsPageProps {
  healthCheckAnswers: IAlcoholConsumption;
  updateHealthCheckAnswers: (value: IAlcoholConsumption) => Promise<void>;
}

export default function AlcoholTypicalUnitsPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<AlcoholTypicalUnitsPageProps>) {
  const errorMessage = 'Select how many units you have on a typical day';

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const [alcoholDailyUnits, setAlcoholDailyUnits] = useState<string>(
    healthCheckAnswers.alcoholDailyUnits ?? ''
  );

  const isValid = (): boolean => {
    return alcoholDailyUnits !== '';
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
      alcoholDailyUnits
    } as IAlcoholConsumption);
    return {
      isSubmitValid: true
    };
  };

  function onAlcoholDailyUnitsChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAlcoholDailyUnits(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#alcohol-units-1">
                {error}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={
          'On a typical day when you drink alcohol, how many units do you have?'
        }
        legendProps={{
          isPageHeading: true
        }}
        id="alcohol-units"
        onChange={onAlcoholDailyUnitsChange}
        error={error}
      >
        {Object.values(AlcoholDailyUnits).map((item) => {
          return (
            <Radios.Radio
              key={item}
              name="alcohol-units"
              value={item}
              checked={(alcoholDailyUnits as AlcoholDailyUnits) === item}
            >
              {EnumDescriptions.AlcoholDailyUnits[item]}
            </Radios.Radio>
          );
        })}
      </RadiosWrapper>
      <Details>
        <Details.Summary>What is a unit of alcohol?</Details.Summary>
        <Details.Text>
          1 unit of alcohol is equal to 10ml of pure alcohol. A single (25ml)
          measure of a spirit is around 1 unit. A pint of beer or small (175ml)
          glass of wine is around 2 units.
        </Details.Text>
      </Details>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
