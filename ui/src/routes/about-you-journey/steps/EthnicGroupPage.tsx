import { ErrorSummary, Radios } from 'nhsuk-react-components';
import { EthnicBackground, type IAboutYou } from '@dnhc-health-checks/shared';
import { useState } from 'react';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import RadiosWrapper from '../../../lib/components/wrapper/radios-wrapper';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface EthnicGroupPageProps {
  healthCheckAnswers: IAboutYou;
  updateHealthCheckAnswers: (value: Partial<IAboutYou>) => Promise<void>;
}

export default function EthnicGroupPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<EthnicGroupPageProps>) {
  const errorMessage = 'Select your ethnic group';
  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();
  const [ethnicBackground, setEthnicBackground] = useState<string>(
    healthCheckAnswers.ethnicBackground ?? ''
  );

  const isValid = (): boolean => {
    return ethnicBackground !== '';
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
      ethnicBackground: ethnicBackground
    } as IAboutYou);
    return {
      isSubmitValid: true
    };
  };

  function onEthnicBackgroundChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEthnicBackground(e.target.value);
  }

  return (
    <>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href="#ethnicity-1">{error}</ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <RadiosWrapper
        legend={'What is your ethnic group?'}
        legendProps={{
          isPageHeading: true
        }}
        id="ethnicity"
        onChange={onEthnicBackgroundChange}
        hint="Your ethnicity may impact your chances of developing some conditions
            that affect your heart."
        error={error}
      >
        {Object.values(EthnicBackground).map((item) => (
          <Radios.Radio
            key={item}
            name="ethnic-group"
            value={item}
            checked={(ethnicBackground as EthnicBackground) === item}
          >
            {EnumDescriptions.EthnicBackground[item]}
          </Radios.Radio>
        ))}
      </RadiosWrapper>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
