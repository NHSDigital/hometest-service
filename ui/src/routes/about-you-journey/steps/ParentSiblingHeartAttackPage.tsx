import { ErrorSummary, Radios } from 'nhsuk-react-components';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import {
  type IAboutYou,
  ParentSiblingHeartAttack
} from '@dnhc-health-checks/shared';
import { useState } from 'react';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface ParentSiblingHeartAttackPageProps {
  healthCheckAnswers: IAboutYou;
  updateHealthCheckAnswers: (value: Partial<IAboutYou>) => Promise<void>;
}

export default function ParentSiblingHeartAttackPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<ParentSiblingHeartAttackPageProps>) {
  const errorMessage =
    'Select if a parent or sibling had a heart attack or angina before 60';

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const [hasFamilyHeartAttackHistory, setHasFamilyHeartAttackHistory] =
    useState<string>(healthCheckAnswers.hasFamilyHeartAttackHistory ?? '');

  const isValid = (): boolean => {
    return hasFamilyHeartAttackHistory !== '';
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
      hasFamilyHeartAttackHistory: hasFamilyHeartAttackHistory
    } as IAboutYou);
    return {
      isSubmitValid: true
    };
  };

  function onParentsOrSiblingsHadAttackOrAnginaBefore60Change(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setHasFamilyHeartAttackHistory(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              {error && (
                <ErrorSummary.Item href="#parent-sibling-heart-attack-1">
                  {error}
                </ErrorSummary.Item>
              )}
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={
          'Have any of your parents or siblings had a heart attack or angina before the age of 60?'
        }
        legendProps={{
          isPageHeading: true
        }}
        id="parent-sibling-heart-attack"
        onChange={onParentsOrSiblingsHadAttackOrAnginaBefore60Change}
        error={error}
      >
        {Object.values(ParentSiblingHeartAttack).map((item) => (
          <Radios.Radio
            key={item}
            name="parent-sibling-heart-attack"
            value={item}
            checked={
              (hasFamilyHeartAttackHistory as ParentSiblingHeartAttack) === item
            }
          >
            {EnumDescriptions.ParentSiblingHeartAttack[item]}
          </Radios.Radio>
        ))}
      </RadiosWrapper>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
