import { useRef, useState } from 'react';
import { ErrorSummary, Fieldset, TextInput } from 'nhsuk-react-components';
import {
  type IHealthCheckBloodTestOrder,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { Link, useNavigate } from 'react-router-dom';
import {
  getStepUrl,
  JourneyStepNames,
  RoutePath
} from '../../../lib/models/route-paths';
import validatePostCodeFormat, {
  normalisePostcode,
  PostCodeValidationResult
} from '../../../lib/validation/validate-post-code';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import { addressTextInputMaxLength } from '../../../settings';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import _ from 'lodash';
import { useAuditEvent } from '../../../hooks/eventAuditHook';

interface FindAddressPageProps {
  order: Partial<IHealthCheckBloodTestOrder>;
  searchForAddress: (
    order: Partial<IHealthCheckBloodTestOrder>
  ) => Promise<void>;
  healthCheck?: IHealthCheck;
  patientId: string;
}

export default function FindAddressPage({
  order,
  searchForAddress,
  healthCheck,
  patientId
}: FindAddressPageProps) {
  const navigate = useNavigate();
  const { triggerAuditEvent } = useAuditEvent();

  const inputMaxLength = addressTextInputMaxLength
    ? +addressTextInputMaxLength
    : 35;

  const postcodeRef = useRef<HTMLInputElement>(null);
  const buildingNumberRef = useRef<HTMLInputElement>(null);

  const [postcodeError, setPostCodeError] = useState<string | undefined>();
  const [buildingNumberError, setBuildingNumberError] = useState<
    string | undefined
  >();
  const { setIsPageInError } = usePageTitleContext();

  const handleSubmit = async (): Promise<SubmitValidationResult> => {
    clearErrors();

    const postcode = normalisePostcode(postcodeRef.current!.value);

    const formIsValid = validate(postcode);
    if (!formIsValid) {
      setIsPageInError(true);
      return {
        isSubmitValid: false
      };
    }

    const address: Partial<IHealthCheckBloodTestOrder> = {
      searchParams: {
        postcode: postcode.trim(),
        buildingNumber: buildingNumberRef.current!.value.trim()
      },
      isBloodTestSectionSubmitted: false
    };

    try {
      await searchForAddress(address);
    } catch {
      navigate(
        getStepUrl(
          RoutePath.BloodTestJourney,
          JourneyStepNames.ProblemFindingAddressPage
        )
      );

      void triggerAuditEvent({
        eventType: AuditEventType.ErrorAddressLookup,
        healthCheck,
        patientId
      });
    }
    return {
      isSubmitValid: true
    };
  };

  function clearErrors() {
    setPostCodeError(undefined);
    setBuildingNumberError(undefined);
  }

  function validate(postcode: string): boolean {
    const postcodeValid = validatePostCode(postcode);
    const buildingNumberValid = validateBuildingNumber();

    return postcodeValid && buildingNumberValid;
  }

  function validatePostCode(postcode: string): boolean {
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
  }

  function validateBuildingNumber(): boolean {
    const cleanBuildingNumber = _.escape(
      buildingNumberRef.current!.value.trim()
    );
    const buildingNumberValid = cleanBuildingNumber.length <= inputMaxLength;

    if (!buildingNumberValid) {
      setBuildingNumberError(
        `Building name or number must be ${inputMaxLength} characters or less`
      );
    }

    return buildingNumberValid;
  }

  const postcodeId = 'address-postal-code';
  const buildingNumberId = 'address-building-number';

  return (
    <>
      {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
      {(postcodeError || buildingNumberError) && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              {postcodeError && (
                <ErrorSummary.Item href={`#${postcodeId}`}>
                  {postcodeError}
                </ErrorSummary.Item>
              )}
              {buildingNumberError && (
                <ErrorSummary.Item href={`#${buildingNumberId}`}>
                  {buildingNumberError}
                </ErrorSummary.Item>
              )}
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <Fieldset
        aria-describedby="blood-test-order-hint"
        disableErrorLine={true}
      >
        <Fieldset.Legend isPageHeading size="l">
          Find your delivery address
        </Fieldset.Legend>
        <div id="blood-test-order-hint" className="nhsuk-hint">
          Find the address you would like your blood test kit to be sent to.
        </div>
        <TextInput
          label="Postcode"
          id={postcodeId}
          className="app-u-uppercase"
          name="address-postal-code"
          autoComplete="postal-code"
          width={10}
          inputRef={postcodeRef}
          defaultValue={order.searchParams?.postcode ?? ''}
          hint="For example, AA3 1AB"
          error={postcodeError}
        />
        <TextInput
          label="Building number or name (optional)"
          id={buildingNumberId}
          name="address-building-number"
          width={10}
          inputRef={buildingNumberRef}
          defaultValue={order.searchParams?.buildingNumber ?? ''}
          hint="For example, 15 or Prospect Cottage"
          error={buildingNumberError}
        />
      </Fieldset>
      <FormButton onButtonClick={handleSubmit}>Continue</FormButton>
      <p>
        <Link
          to={getStepUrl(
            RoutePath.BloodTestJourney,
            JourneyStepNames.EnterAddressPage
          )}
        >
          Enter address manually
        </Link>
      </p>
    </>
  );
}
