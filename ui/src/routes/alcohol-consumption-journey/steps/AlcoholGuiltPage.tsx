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

interface AlcoholGuiltPageProps {
  healthCheckAnswers: IAlcoholConsumption;
  updateHealthCheckAnswers: (value: IAlcoholConsumption) => Promise<void>;
}

export default function AlcoholGuiltPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: AlcoholGuiltPageProps) {
  const errorMessage =
    "Select how often in the past year you've felt guilty or remorseful after drinking";

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const [alcoholGuilt, setAlcoholGuilt] = useState<string>(
    healthCheckAnswers.alcoholGuilt ?? ''
  );

  const isValid = (): boolean => {
    return alcoholGuilt !== '';
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
      alcoholGuilt: alcoholGuilt
    } as IAlcoholConsumption);
    return {
      isSubmitValid: true
    };
  };

  function onAlcoholGuiltChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAlcoholGuilt(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#guilt-1">{error}</ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={
          'In the past year, how often have you felt guilty or remorseful after drinking?'
        }
        legendProps={{
          isPageHeading: true
        }}
        id="guilt"
        onChange={onAlcoholGuiltChange}
        error={error}
      >
        {Object.values(AlcoholEventsFrequency).map((item) => {
          return (
            <Radios.Radio
              key={item}
              name="guilt"
              value={item}
              checked={(alcoholGuilt as AlcoholEventsFrequency) === item}
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
