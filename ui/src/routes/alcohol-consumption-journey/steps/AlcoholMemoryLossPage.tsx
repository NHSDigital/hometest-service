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

interface AlcoholMemoryLossPageProps {
  healthCheckAnswers: IAlcoholConsumption;
  updateHealthCheckAnswers: (value: IAlcoholConsumption) => Promise<void>;
}

export default function AlcoholMemoryLossPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: AlcoholMemoryLossPageProps) {
  const errorMessage =
    "Select how often in the past year you've been unable to remember what happened the night before because of your drinking";

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const [alcoholMemoryLoss, setAlcoholMemoryLoss] = useState<string>(
    healthCheckAnswers.alcoholMemoryLoss ?? ''
  );

  const isValid = (): boolean => {
    return alcoholMemoryLoss !== '';
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
      alcoholMemoryLoss: alcoholMemoryLoss
    } as IAlcoholConsumption);
    return {
      isSubmitValid: true
    };
  };

  function onAlcoholMemoryLossChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAlcoholMemoryLoss(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#memory-loss-1">
                {error}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={
          'In the past year, how often have you been unable to remember what happened the night before because of your drinking?'
        }
        legendProps={{
          isPageHeading: true
        }}
        id="memory-loss"
        onChange={onAlcoholMemoryLossChange}
        error={error}
      >
        {Object.values(AlcoholEventsFrequency).map((item) => {
          return (
            <Radios.Radio
              key={item}
              name="memory-loss"
              value={item}
              checked={(alcoholMemoryLoss as AlcoholEventsFrequency) === item}
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
