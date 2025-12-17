import { Radios, ErrorSummary } from 'nhsuk-react-components';
import React, { useState } from 'react';
import { usePageTitleContext } from '../contexts/PageTitleContext';
import FormButton, { type SubmitValidationResult } from './FormButton';
import FieldsetErrorWrapper from './wrapper/fieldset-error-wrapper';

interface RadiosConfirmProps {
  errorMessage: string;
  titleOfRadio: string;
  initialValue: boolean | null;
  idOfRadioParent: string;
  booleanTexts: {
    isTrue: string;
    isFalse: string;
  };
  onContinue: (confirm: boolean) => Promise<void>;
  continueButtonText?: string;
  hint?: string;
  headingLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  headingSize?: 'xl' | 'l' | 'm' | 's';
  children?: React.ReactNode;
}

export default function RadiosConfirm({
  errorMessage,
  titleOfRadio,
  initialValue,
  idOfRadioParent,
  booleanTexts,
  onContinue,
  continueButtonText,
  hint,
  headingLevel = 'h1',
  headingSize = 'l',
  children
}: Readonly<RadiosConfirmProps>) {
  const continueButton = continueButtonText ?? 'Continue';
  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();
  const [confirm, setConfirm] = useState<boolean | null>(initialValue);

  function onChangeConfirmation(e: React.ChangeEvent<HTMLInputElement>) {
    setConfirm(e.target.value === 'true');
  }

  const handleNext = async (): Promise<SubmitValidationResult> => {
    if (confirm === null) {
      setError(errorMessage);
      setIsPageInError(true);
      return {
        isSubmitValid: false
      };
    }

    await onContinue(confirm);
    return {
      isSubmitValid: true
    };
  };

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href={`#${idOfRadioParent}-1`}>
                {error}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}

      {children}

      <FieldsetErrorWrapper
        legend={titleOfRadio}
        legendProps={{
          isPageHeading: true,
          headingLevel,
          size: headingSize
        }}
        id={idOfRadioParent}
        hint={hint}
        error={error}
      >
        <Radios
          id={idOfRadioParent}
          name={idOfRadioParent}
          onChange={onChangeConfirmation}
        >
          <Radios.Radio value="true" checked={confirm === true}>
            {booleanTexts.isTrue}
          </Radios.Radio>
          <Radios.Radio value="false" checked={confirm === false}>
            {booleanTexts.isFalse}
          </Radios.Radio>
        </Radios>
      </FieldsetErrorWrapper>

      <FormButton onButtonClick={handleNext}>{continueButton}</FormButton>
    </>
  );
}
