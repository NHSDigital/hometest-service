import { ErrorSummary, Radios } from 'nhsuk-react-components';
import {
  AlcoholPersonInjuredAndConcernedRelative,
  type IAlcoholConsumption
} from '@dnhc-health-checks/shared';
import { useState } from 'react';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface AlcoholPersonInjuredPageProps {
  healthCheckAnswers: IAlcoholConsumption;
  updateHealthCheckAnswers: (value: IAlcoholConsumption) => Promise<void>;
}

export default function AlcoholPersonInjuredPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: AlcoholPersonInjuredPageProps) {
  const errorMessage =
    'Select yes if you or somebody else has been injured as a result of your drinking';

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const [alcoholPersonInjured, setAlcoholPersonInjured] = useState<string>(
    healthCheckAnswers.alcoholPersonInjured ?? ''
  );

  const isValid = (): boolean => {
    return alcoholPersonInjured !== '';
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
      alcoholPersonInjured: alcoholPersonInjured
    } as IAlcoholConsumption);
    return {
      isSubmitValid: true
    };
  };

  function onAlcoholPersonInjuredChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setAlcoholPersonInjured(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#person-injured-1">
                {error}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={
          'Have you or somebody else been injured as a result of your drinking?'
        }
        legendProps={{
          isPageHeading: true
        }}
        id="person-injured"
        onChange={onAlcoholPersonInjuredChange}
        error={error}
      >
        {Object.values(AlcoholPersonInjuredAndConcernedRelative).map((item) => {
          return (
            <Radios.Radio
              key={item}
              name="person-injured"
              value={item}
              checked={
                (alcoholPersonInjured as AlcoholPersonInjuredAndConcernedRelative) ===
                item
              }
            >
              {EnumDescriptions.AlcoholPersonInjuredAndConcernedRelative[item]}
            </Radios.Radio>
          );
        })}
      </RadiosWrapper>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
