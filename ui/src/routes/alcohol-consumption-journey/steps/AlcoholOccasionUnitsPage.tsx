import { ErrorSummary, Radios } from 'nhsuk-react-components';
import {
  AlcoholEventsFrequency,
  type IAlcoholConsumption
} from '@dnhc-health-checks/shared';
import { useState } from 'react';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface AlcoholOccasionUnitsPageProps {
  healthCheckAnswers: IAlcoholConsumption;
  updateHealthCheckAnswers: (value: IAlcoholConsumption) => Promise<void>;
}

export default function AlcoholOccasionUnitsPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: AlcoholOccasionUnitsPageProps) {
  const errorMessage =
    "Select how often in the past year you've had 6 or more alcohol units (if you're female) or 8 or more units (if male) on a single occasion";

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const [alcoholOccasion, setAlcoholOccasion] = useState<string>(
    healthCheckAnswers.alcoholMultipleDrinksOneOccasion ?? ''
  );

  const isValid = (): boolean => {
    return alcoholOccasion !== '';
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
      alcoholMultipleDrinksOneOccasion: alcoholOccasion
    } as IAlcoholConsumption);
    return {
      isSubmitValid: true
    };
  };

  function onAlcoholOccasionChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAlcoholOccasion(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#alcohol-occasional-units-1">
                {error}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={
          "In the past year, how often have you had 6 or more alcohol units (if you're female) or 8 or more units (if male) on a single occasion?"
        }
        legendProps={{
          isPageHeading: true
        }}
        id="alcohol-occasional-units"
        onChange={onAlcoholOccasionChange}
        error={error}
      >
        {Object.values(AlcoholEventsFrequency).map((item) => {
          return (
            <Radios.Radio
              key={item}
              name="occasional-units"
              value={item}
              checked={(alcoholOccasion as AlcoholEventsFrequency) === item}
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
