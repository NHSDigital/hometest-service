import React, { useState } from 'react';
import {
  EthnicBackground,
  EthnicBackgroundOther,
  type IAboutYou
} from '@dnhc-health-checks/shared';
import { Radios, ErrorSummary } from 'nhsuk-react-components';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface DescribeEthnicBackgroundPageProps {
  healthCheckAnswers: IAboutYou;
  updateHealthCheckAnswers: (value: Partial<IAboutYou>) => Promise<void>;
}

let options: [string, string][];

export function DescribeEthnicBackgroundPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<DescribeEthnicBackgroundPageProps>) {
  const errorMessage: string =
    healthCheckAnswers.ethnicBackground !== EthnicBackground.Other
      ? `Select your ${EnumDescriptions.EthnicBackground[healthCheckAnswers.ethnicBackground!]} background or '${EnumDescriptions.OtherDetailedEthnicGroup[EthnicBackgroundOther.PreferNotToSay]}'`
      : `Select your background or '${EnumDescriptions.OtherDetailedEthnicGroup[EthnicBackgroundOther.PreferNotToSay]}'`;

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  options = Object.entries(
    EnumDescriptions.DetailedEthnicGroup[healthCheckAnswers.ethnicBackground!]
  );

  const [detailedEthnicGroup, setDetailedEthnicGroup] = useState<string>(
    healthCheckAnswers.detailedEthnicGroup ?? ''
  );

  const isValid = (): boolean => {
    return detailedEthnicGroup !== '';
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
      ethnicBackground: healthCheckAnswers.ethnicBackground,
      detailedEthnicGroup: detailedEthnicGroup
    });
    return {
      isSubmitValid: true
    };
  };

  function onDetailedEthnicGroupChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDetailedEthnicGroup(e.target.value);
  }

  const legend = (): string => {
    const ethnicBackground = healthCheckAnswers.ethnicBackground;
    if (ethnicBackground === EthnicBackground.Other) {
      return 'Which of the following best describes your ethnic group?';
    } else if (ethnicBackground === EthnicBackground.MixedOrMultipleGroups) {
      return `Which of the following best describes your ${EnumDescriptions.EthnicBackground[EthnicBackground.MixedOrMultipleGroups]}?`;
    } else {
      return `Which of the following best describes your ${EnumDescriptions.EthnicBackground[ethnicBackground!]} group?`;
    }
  };

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#detailed-ethnicity-1">
                {error}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={legend()}
        legendProps={{
          isPageHeading: true
        }}
        id="detailed-ethnicity"
        onChange={onDetailedEthnicGroupChange}
        error={error}
      >
        {options.map(([key, value]) => (
          <Radios.Radio
            key={key}
            name="detailed-ethnic-group"
            value={key}
            checked={detailedEthnicGroup === key}
          >
            {value}
          </Radios.Radio>
        ))}
        <Radios.Divider>or</Radios.Divider>
        <Radios.Radio
          id="detailed-ethnic-group-prefer-not-to-say"
          name="detailed-ethnic-group"
          value={EthnicBackgroundOther.PreferNotToSay}
          checked={
            (detailedEthnicGroup as EthnicBackgroundOther) ===
            EthnicBackgroundOther.PreferNotToSay
          }
        >
          {
            EnumDescriptions.OtherDetailedEthnicGroup[
              EthnicBackgroundOther.PreferNotToSay
            ]
          }
        </Radios.Radio>
      </RadiosWrapper>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
