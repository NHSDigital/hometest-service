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

interface AlcoholStopPageProps {
  healthCheckAnswers: IAlcoholConsumption;
  updateHealthCheckAnswers: (value: IAlcoholConsumption) => Promise<void>;
}

export default function AlcoholStopPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<AlcoholStopPageProps>) {
  const errorMessage =
    "Select how often in the past year you've been unable to stop drinking once you started";

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const [alcoholStop, setAlcoholStop] = useState<string>(
    healthCheckAnswers.alcoholCannotStop ?? ''
  );

  const isValid = (): boolean => {
    return alcoholStop !== '';
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
      alcoholCannotStop: alcoholStop
    } as IAlcoholConsumption);
    return {
      isSubmitValid: true
    };
  };

  function onAlcoholStopChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAlcoholStop(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#alcohol-stop-1">
                {error}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={
          'In the past year, how often have you found you were not able to stop drinking once you started?'
        }
        legendProps={{
          isPageHeading: true
        }}
        id="alcohol-stop"
        onChange={onAlcoholStopChange}
        error={error}
      >
        {Object.values(AlcoholEventsFrequency).map((item) => {
          return (
            <Radios.Radio
              key={item}
              name="alcohol-stop"
              value={item}
              checked={(alcoholStop as AlcoholEventsFrequency) === item}
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
