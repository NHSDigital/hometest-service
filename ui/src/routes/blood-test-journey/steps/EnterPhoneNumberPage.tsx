import { useRef, useState } from 'react';
import { ErrorSummary, Fieldset, TextInput } from 'nhsuk-react-components';
import {
  type IHealthCheckBloodTestOrder,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import validateUKPhoneNumber, {
  formatPhoneNumber,
  PhoneNumberValidationResult
} from '../../../lib/validation/validate-phone-number';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';

interface EnterPhoneNumberPageProps {
  enteredPhoneNumber: IHealthCheckBloodTestOrder;
  updateHealthCheckBloodTestOrder: (
    phoneNumber: IHealthCheckBloodTestOrder
  ) => Promise<void>;
  readonly healthCheck?: IHealthCheck;
  readonly patientId: string;
}

export default function EnterPhoneNumberPage({
  enteredPhoneNumber,
  updateHealthCheckBloodTestOrder
}: EnterPhoneNumberPageProps) {
  const error = 'Enter a UK mobile phone number in the correct format';
  const phoneNumberRef = useRef<HTMLInputElement>(null);

  const [errorsPresent, setErrorPresent] = useState<string | undefined>();
  const { setIsPageInError } = usePageTitleContext();

  const handleNext = async (): Promise<SubmitValidationResult> => {
    setErrorPresent(undefined);

    let phoneNumber = phoneNumberRef.current!.value;
    const validationResult = validateUKPhoneNumber(phoneNumber);

    if (validationResult === PhoneNumberValidationResult.INVALID) {
      setIsPageInError(true);
      setErrorPresent(error);
      return { isSubmitValid: false };
    }
    if (validationResult === PhoneNumberValidationResult.VALID) {
      phoneNumber = formatPhoneNumber(phoneNumber);
    }
    const bloodTestOrder: IHealthCheckBloodTestOrder = {
      phoneNumber,
      isBloodTestSectionSubmitted: false
    };

    await updateHealthCheckBloodTestOrder(bloodTestOrder);
    return { isSubmitValid: true };
  };

  const phoneNumberId = 'phone-number';
  return (
    <>
      {errorsPresent && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item href={`#${phoneNumberId}`}>
                {error}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <h1>Get text updates about your blood test</h1>
      <p>
        To receive text messages about your blood test, enter your UK mobile
        phone number.
      </p>
      <p>
        We will only use this number to send you updates about your blood test.
      </p>
      <Fieldset
        aria-describedby="blood-test-order-hint"
        disableErrorLine={true}
      >
        <TextInput
          hint="For example, 07771 900 900 or +44 7771 900 900"
          label="Enter your UK mobile phone number (optional)"
          labelProps={{ size: 'm' }}
          id={phoneNumberId}
          name="phone-Number"
          autoComplete="tel"
          inputRef={phoneNumberRef}
          error={errorsPresent}
          className="app-u-uppercase"
          width={10}
          defaultValue={enteredPhoneNumber?.phoneNumber ?? ''}
        />
      </Fieldset>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
