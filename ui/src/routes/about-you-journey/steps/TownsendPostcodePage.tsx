import { useRef, useState } from 'react';
import { type IAboutYou } from '@dnhc-health-checks/shared';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import {
  ErrorSummary,
  Fieldset,
  HintText,
  TextInput
} from 'nhsuk-react-components';
import validatePostCode, {
  normalisePostcode,
  PostCodeValidationResult
} from '../../../lib/validation/validate-post-code';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';

interface TownsendPostcodePageProps {
  healthCheckAnswers: IAboutYou;
  updateHealthCheckAnswers: (value: Partial<IAboutYou>) => Promise<void>;
}

export default function TownsendPostcodePage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<TownsendPostcodePageProps>) {
  const errorMessage = 'Enter a full UK postcode';

  const [error, setError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const postcodeRef = useRef<HTMLInputElement>(null);

  const handleNext = async (): Promise<SubmitValidationResult> => {
    const postcode = normalisePostcode(postcodeRef.current!.value);
    const validationResult = validatePostCode(postcode);

    if (validationResult === PostCodeValidationResult.EMPTY) {
      await updateHealthCheckAnswers({ postcode: null });
      return {
        isSubmitValid: true
      };
    } else if (
      validationResult === PostCodeValidationResult.INVALID ||
      validationResult === PostCodeValidationResult.PARTIAL
    ) {
      setError(errorMessage);
      setIsPageInError(true);
      return {
        isSubmitValid: false
      };
    }
    await updateHealthCheckAnswers({ postcode: postcode } as IAboutYou);
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
              <ErrorSummary.Item href="#postcode">{error}</ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <Fieldset disableErrorLine={true} aria-describedby="postcode-hint">
        <Fieldset.Legend isPageHeading size="l">
          Enter your postcode
        </Fieldset.Legend>
        <HintText id="postcode-hint">
          We ask for your postcode to calculate health statistics for your area.
          This helps us to estimate your heart age.
        </HintText>

        <TextInput
          label="Enter your full postcode (optional)"
          labelProps={{
            className: 'nhsuk-label--m nhsuk-u-margin-bottom-2'
          }}
          id="postcode"
          className="app-u-uppercase"
          name="address-postal-code"
          autoComplete="postal-code"
          width={10}
          inputRef={postcodeRef}
          defaultValue={healthCheckAnswers.postcode ?? ''}
          hint="For example, AA3 1AB"
          hintProps={{ className: 'nhsuk-u-margin-bottom-2' }}
          error={error}
        />
      </Fieldset>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
