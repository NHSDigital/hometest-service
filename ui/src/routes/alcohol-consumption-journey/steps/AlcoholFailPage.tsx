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

interface AlcoholFailPageProps {
  healthCheckAnswers: IAlcoholConsumption;
  updateHealthCheckAnswers: (value: IAlcoholConsumption) => Promise<void>;
}

export default function AlcoholFailPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: AlcoholFailPageProps) {
  const errorMessage =
    "Select how often in the past year you've failed to do what was expected of you because of your drinking";

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const [alcoholFail, setAlcoholFail] = useState<string>(
    healthCheckAnswers.alcoholFailedObligations ?? ''
  );

  const isValid = (): boolean => {
    return alcoholFail !== '';
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
      alcoholFailedObligations: alcoholFail
    } as IAlcoholConsumption);
    return {
      isSubmitValid: true
    };
  };

  function onAlcoholFailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAlcoholFail(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#alcohol-fail-1">
                {error}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={
          'In the past year, how often have you failed to do what was expected of you because of your drinking?'
        }
        legendProps={{
          isPageHeading: true
        }}
        id="alcohol-fail"
        onChange={onAlcoholFailChange}
        error={error}
      >
        {Object.values(AlcoholEventsFrequency).map((item) => {
          return (
            <Radios.Radio
              key={item}
              name="fail"
              value={item}
              checked={(alcoholFail as AlcoholEventsFrequency) === item}
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
