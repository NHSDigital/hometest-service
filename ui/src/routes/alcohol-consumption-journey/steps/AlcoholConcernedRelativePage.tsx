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

interface AlcoholConcernedRelativePageProps {
  healthCheckAnswers: IAlcoholConsumption;
  updateHealthCheckAnswers: (value: IAlcoholConsumption) => Promise<void>;
}

export default function AlcoholConcernedRelativePage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: AlcoholConcernedRelativePageProps) {
  const errorMessage =
    'Select yes if a relative, friend, doctor or other health worker has been concerned about your drinking, or suggested that you cut down';

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const [alcoholConcernedRelative, setAlcoholConcernedRelative] =
    useState<string>(healthCheckAnswers.alcoholConcernedRelative ?? '');

  const isValid = (): boolean => {
    return alcoholConcernedRelative !== '';
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
      alcoholConcernedRelative: alcoholConcernedRelative
    } as IAlcoholConsumption);
    return {
      isSubmitValid: true
    };
  };

  function onAlcoholConcernedRelativeChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setAlcoholConcernedRelative(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#concerned-1">{error}</ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={
          'Has a relative, friend, doctor or other health worker been concerned about your drinking, or suggested that you cut down?'
        }
        legendProps={{
          isPageHeading: true
        }}
        id="concerned"
        onChange={onAlcoholConcernedRelativeChange}
        error={error}
      >
        {Object.values(AlcoholPersonInjuredAndConcernedRelative).map((item) => {
          return (
            <Radios.Radio
              key={item}
              name="concerned-relative"
              value={item}
              checked={
                (alcoholConcernedRelative as AlcoholPersonInjuredAndConcernedRelative) ===
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
