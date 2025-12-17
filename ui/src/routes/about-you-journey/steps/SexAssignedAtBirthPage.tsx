import { Details, ErrorSummary, Radios } from 'nhsuk-react-components';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import { type IAboutYou, Sex } from '@dnhc-health-checks/shared';
import React, { useState } from 'react';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface SexAssignedAtBirthPageProps {
  healthCheckAnswers: IAboutYou;
  updateHealthCheckAnswers: (value: Partial<IAboutYou>) => Promise<void>;
}

export default function SexAssignedAtBirthPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<SexAssignedAtBirthPageProps>) {
  const errorMessage = 'Select your sex assigned at birth';

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const [sex, setSex] = useState<string>(healthCheckAnswers.sex ?? '');

  const isValid = (value: string): boolean => {
    return value !== '';
  };

  const handleNext = async (): Promise<SubmitValidationResult> => {
    if (!isValid(sex)) {
      setError(errorMessage);
      setIsPageInError(true);
      return {
        isSubmitValid: false
      };
    }

    if (
      isValid(healthCheckAnswers.sex ?? '') &&
      (sex as Sex) !== healthCheckAnswers.sex
    ) {
      await updateHealthCheckAnswers({
        sex: sex,
        impotence: null
      } as IAboutYou);
    } else {
      await updateHealthCheckAnswers({ sex: sex } as IAboutYou);
    }

    return {
      isSubmitValid: true
    };
  };

  function onSexAssignedAtBirthChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSex(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#sex-assigned-at-birth-1">
                {error}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={'What is your sex assigned at birth?'}
        legendProps={{
          isPageHeading: true
        }}
        id="sex-assigned-at-birth"
        onChange={onSexAssignedAtBirthChange}
        error={error}
      >
        {Object.values(Sex).map((item) => (
          <Radios.Radio
            key={item}
            name="sex-assigned"
            value={item}
            checked={(sex as Sex) === item}
          >
            {EnumDescriptions.Sex[item]}
          </Radios.Radio>
        ))}
      </RadiosWrapper>
      <Details>
        <Details.Summary>Why do we ask this?</Details.Summary>
        <Details.Text>
          Your sex affects your heart age, as well as your risk of diabetes and
          cardiovascular disease. We know you may not identify with the sex on
          your medical record. Your information will be anonymous. It is only
          used to calculate your health.
        </Details.Text>
      </Details>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
