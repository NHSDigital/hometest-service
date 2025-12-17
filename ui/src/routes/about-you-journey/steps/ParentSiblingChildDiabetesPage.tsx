import { ErrorSummary, Radios } from 'nhsuk-react-components';
import {
  type IAboutYou,
  ParentSiblingChildDiabetes
} from '@dnhc-health-checks/shared';
import React, { useState } from 'react';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface ParentSiblingChildDiabetesPageProps {
  healthCheckAnswers: IAboutYou;
  updateHealthCheckAnswers: (value: Partial<IAboutYou>) => Promise<void>;
}

export default function ParentSiblingChildDiabetesPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<ParentSiblingChildDiabetesPageProps>) {
  const errorMessage =
    'Select if you have a parent, sibling or child with diabetes';

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const [hasFamilyDiabetesHistory, setHasFamilyDiabetesHistory] =
    useState<string>(healthCheckAnswers.hasFamilyDiabetesHistory ?? '');

  const isValid = (): boolean => {
    return hasFamilyDiabetesHistory !== '';
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
      hasFamilyDiabetesHistory: hasFamilyDiabetesHistory
    } as IAboutYou);
    return {
      isSubmitValid: true
    };
  };

  function onParentsSiblingsChildHaveDiabetesChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setHasFamilyDiabetesHistory(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              {error && (
                <ErrorSummary.Item href="#parent-sibling-child-diabetes-1">
                  {error}
                </ErrorSummary.Item>
              )}
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={'Do you have a parent, sibling or child with diabetes?'}
        legendProps={{
          isPageHeading: true
        }}
        id="parent-sibling-child-diabetes"
        onChange={onParentsSiblingsChildHaveDiabetesChange}
        hint="Having a close relative with diabetes increases your risk of developing type 2 diabetes."
        error={error}
      >
        {Object.values(ParentSiblingChildDiabetes).map((item) => (
          <Radios.Radio
            key={item}
            name="parent-sibling-child-diabetes"
            value={item}
            checked={
              (hasFamilyDiabetesHistory as ParentSiblingChildDiabetes) === item
            }
          >
            {EnumDescriptions.ParentSiblingChildDiabetes[item]}
          </Radios.Radio>
        ))}
      </RadiosWrapper>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
