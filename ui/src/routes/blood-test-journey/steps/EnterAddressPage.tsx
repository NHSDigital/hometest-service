import { useCallback, useEffect, useRef, useState } from 'react';
import { ErrorSummary, Fieldset, TextInput } from 'nhsuk-react-components';
import {
  type IHealthCheckBloodTestOrder,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import validatePostCodeFormat, {
  normalisePostcode,
  PostCodeValidationResult
} from '../../../lib/validation/validate-post-code';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import { addressTextInputMaxLength } from '../../../settings';
import { EventAuditButton } from '../../../lib/components/event-audit-button';
import _ from 'lodash';

interface EnterAddressPageProps {
  order: IHealthCheckBloodTestOrder;
  updateHealthCheckBloodTestOrder: (
    address: IHealthCheckBloodTestOrder
  ) => Promise<void>;
  healthCheck?: IHealthCheck;
  patientId: string;
}

export default function EnterAddressPage({
  order,
  updateHealthCheckBloodTestOrder,
  healthCheck,
  patientId
}: EnterAddressPageProps) {
  const inputMaxLength = addressTextInputMaxLength
    ? +addressTextInputMaxLength
    : 35;

  const addressLine1Ref = useRef<HTMLInputElement>(null);
  const addressLine2Ref = useRef<HTMLInputElement>(null);
  const addressLine3Ref = useRef<HTMLInputElement>(null);
  const townRef = useRef<HTMLInputElement>(null);
  const postcodeRef = useRef<HTMLInputElement>(null);

  const [postcodeError, setPostCodeError] = useState<string | undefined>();
  const [addressLine1Error, setAddressLine1Error] = useState<
    string | undefined
  >();
  const [addressLine2Error, setAddressLine2Error] = useState<
    string | undefined
  >();
  const [addressLine3Error, setAddressLine3Error] = useState<
    string | undefined
  >();
  const [townOrCityError, setTownOrCityError] = useState<string | undefined>();
  const { setIsPageInError } = usePageTitleContext();

  const handleNext = async () => {
    clearErrors();

    const postcode = normalisePostcode(postcodeRef.current!.value);

    const formIsValid = validate(postcode);
    if (!formIsValid) {
      setIsPageInError(true);
      return false;
    }

    const bloodTestOrder: IHealthCheckBloodTestOrder = {
      address: {
        addressLine1: addressLine1Ref.current!.value.trim(),
        addressLine2: addressLine2Ref.current!.value.trim(),
        addressLine3: addressLine3Ref.current!.value.trim(),
        townCity: townRef.current!.value.trim(),
        postcode: postcode.trim()
      },
      isBloodTestSectionSubmitted: false
    };
    await updateHealthCheckBloodTestOrder(bloodTestOrder);
    return true;
  };

  const clearErrors = useCallback(() => {
    setPostCodeError(undefined);
    setAddressLine1Error(undefined);
    setAddressLine2Error(undefined);
    setAddressLine3Error(undefined);
    setTownOrCityError(undefined);
  }, []);

  const isCorrectLength = useCallback(
    (value: string): boolean => {
      return _.escape(value).length <= inputMaxLength;
    },
    [inputMaxLength]
  );

  const validateAddressLine1 = useCallback((): boolean => {
    const value = addressLine1Ref.current!.value.trim();
    const addressLine1Entered = isEntered(value);
    const addressLine1LengthCorrect = isCorrectLength(value);

    if (!addressLine1Entered) {
      setAddressLine1Error(
        'Enter address line 1, typically the building and street'
      );
    }
    if (!addressLine1LengthCorrect) {
      setAddressLine1Error(
        `Address line 1 must be ${inputMaxLength} characters or less`
      );
    }

    return addressLine1Entered && addressLine1LengthCorrect;
  }, [inputMaxLength, isCorrectLength]);

  const validateAddressLine2 = useCallback((): boolean => {
    const value = addressLine2Ref.current!.value.trim();
    const addressLine2LengthCorrect = isCorrectLength(value);

    if (!addressLine2LengthCorrect) {
      setAddressLine2Error(
        `Address line 2 must be ${inputMaxLength} characters or less`
      );
    }

    return addressLine2LengthCorrect;
  }, [inputMaxLength, isCorrectLength]);

  const validateAddressLine3 = useCallback((): boolean => {
    const value = addressLine3Ref.current!.value.trim();
    const addressLine3LengthCorrect = isCorrectLength(value);

    if (!addressLine3LengthCorrect) {
      setAddressLine3Error(
        `Address line 3 must be ${inputMaxLength} characters or less`
      );
    }

    return addressLine3LengthCorrect;
  }, [isCorrectLength, inputMaxLength]);

  const validateTownOrCity = useCallback((): boolean => {
    const value = townRef.current!.value.trim();
    const townOrCityEntered = isEntered(value);
    const townOrCityLengthCorrect = isCorrectLength(value);

    if (!townOrCityEntered) {
      setTownOrCityError('Enter town or city');
    }

    if (!townOrCityLengthCorrect) {
      setTownOrCityError(
        `Town or city must be ${inputMaxLength} characters or less`
      );
    }

    return townOrCityEntered && townOrCityLengthCorrect;
  }, [inputMaxLength, isCorrectLength]);

  const validatePostCode = useCallback((postcode: string): boolean => {
    const validationResult = validatePostCodeFormat(postcode);

    if (validationResult === PostCodeValidationResult.VALID) {
      return true;
    }

    let error;

    if (validationResult === PostCodeValidationResult.EMPTY) {
      error = 'Enter postcode';
    } else if (validationResult === PostCodeValidationResult.PARTIAL) {
      error = 'Enter a full postcode';
    } else {
      error = 'Enter a valid postcode';
    }
    setPostCodeError(error);

    return false;
  }, []);

  function isEntered(value: string): boolean {
    return value !== '';
  }

  const validate = useCallback(
    (postcode: string): boolean => {
      const addressLine1Valid = validateAddressLine1();
      const addressLine2Valid = validateAddressLine2();
      const addressLine3Valid = validateAddressLine3();
      const townOrCityValid = validateTownOrCity();
      const postcodeValid = validatePostCode(postcode);

      const wholeFormIsValid =
        addressLine1Valid &&
        addressLine2Valid &&
        addressLine3Valid &&
        townOrCityValid &&
        postcodeValid;

      return wholeFormIsValid;
    },
    [
      validateAddressLine1,
      validateAddressLine2,
      validateAddressLine3,
      validateTownOrCity,
      validatePostCode
    ]
  );

  useEffect(() => {
    if (order?.address?.postcode && order?.address?.addressLine1) {
      validate(order.address.postcode);
    }
  }, [order, validate]);

  const addressLine1Id = 'address-line1';
  const addressLine2Id = 'address-line2';
  const addressLine3Id = 'address-line3';
  const townOrCityId = 'town-city';
  const postcodeId = 'address-postal-code';

  return (
    <>
      {/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */}
      {(addressLine1Error ||
        addressLine2Error ||
        addressLine3Error ||
        townOrCityError ||
        postcodeError) && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              {addressLine1Error && (
                <ErrorSummary.Item href={`#${addressLine1Id}`}>
                  {addressLine1Error}
                </ErrorSummary.Item>
              )}
              {addressLine2Error && (
                <ErrorSummary.Item href={`#${addressLine2Id}`}>
                  {addressLine2Error}
                </ErrorSummary.Item>
              )}
              {addressLine3Error && (
                <ErrorSummary.Item href={`#${addressLine3Id}`}>
                  {addressLine3Error}
                </ErrorSummary.Item>
              )}
              {townOrCityError && (
                <ErrorSummary.Item href={`#${townOrCityId}`}>
                  {townOrCityError}
                </ErrorSummary.Item>
              )}
              {postcodeError && (
                <ErrorSummary.Item href={`#${postcodeId}`}>
                  {postcodeError}
                </ErrorSummary.Item>
              )}
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      {/* eslint-enable @typescript-eslint/prefer-nullish-coalescing */}
      <Fieldset
        aria-describedby="blood-test-order-hint"
        disableErrorLine={true}
      >
        <Fieldset.Legend isPageHeading size="l">
          Enter your delivery address
        </Fieldset.Legend>
        <div id="blood-test-order-hint" className="nhsuk-hint">
          Enter the address you would like your blood test kit to be sent to.
        </div>
        <TextInput
          label="Address line 1"
          id={addressLine1Id}
          name="address-line1"
          autoComplete="address-line1"
          inputRef={addressLine1Ref}
          defaultValue={order.address?.addressLine1 ?? ''}
          error={addressLine1Error}
        />
        <TextInput
          label="Address line 2 (optional)"
          id={addressLine2Id}
          name="address-line2"
          autoComplete="address-line2"
          inputRef={addressLine2Ref}
          defaultValue={order.address?.addressLine2 ?? ''}
          error={addressLine2Error}
        />
        <TextInput
          label="Address line 3 (optional)"
          id={addressLine3Id}
          name="address-line3"
          inputRef={addressLine3Ref}
          defaultValue={order.address?.addressLine3 ?? ''}
          error={addressLine3Error}
        />
        <TextInput
          label="Town or city"
          id={townOrCityId}
          name="address-town"
          autoComplete="address-level2"
          className="nhsuk-u-width-two-thirds"
          inputRef={townRef}
          defaultValue={order.address?.townCity ?? ''}
          error={townOrCityError}
        />
        <TextInput
          label="Postcode"
          id={postcodeId}
          className="app-u-uppercase"
          name="address-postal-code"
          autoComplete="postal-code"
          width={10}
          inputRef={postcodeRef}
          defaultValue={order.address?.postcode ?? ''}
          hint="For example, AA3 1AB"
          error={postcodeError}
        />
      </Fieldset>
      <EventAuditButton
        onClick={handleNext}
        auditEvents={[
          {
            eventType: AuditEventType.DeliveryAddressEntered,
            healthCheck,
            patientId
          }
        ]}
      >
        Continue
      </EventAuditButton>
    </>
  );
}
