import {
  type IBodyMeasurements,
  WaistMeasurementDisplayPreference
} from '@dnhc-health-checks/shared';
import { useRef, useState } from 'react';
import {
  convertToNumber,
  round
} from '../../../lib/converters/integer-converter';
import {
  ErrorMessage,
  ErrorSummary,
  TextInput,
  Fieldset
} from 'nhsuk-react-components';
import { Link } from 'react-router-dom';
import {
  convertCmToInches,
  convertInchesToCm
} from '../../../lib/converters/body-measurements-converter';
import { JourneyStepNames } from '../../../lib/models/route-paths';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import { MEASUREMENT_SWITCHER_FOCUS_DELAY_MS } from '../focus-helper';

const WaistMeasurementLimits = {
  inInches: {
    min: 14,
    max: 120
  },
  inCentimetres: {
    min: 35.6,
    max: 304.8
  }
};

interface WaistMeasurementPageProps {
  healthCheckAnswers: IBodyMeasurements;
  updateHealthCheckAnswers: (
    value: Partial<IBodyMeasurements>
  ) => Promise<void>;
}

export default function WaistMeasurementPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<WaistMeasurementPageProps>) {
  const errors = {
    waistMeasurement: {
      required: 'Enter your waist measurement',
      inCentimetresTooHighOrTooLow: `Waist measurement must be between ${WaistMeasurementLimits.inCentimetres.min} centimetres and ${WaistMeasurementLimits.inCentimetres.max} centimetres`,
      inInchesTooHighOrTooLow: `Waist measurement must be between ${WaistMeasurementLimits.inInches.min} inches and ${WaistMeasurementLimits.inInches.max} inches`
    }
  };

  const cmInputRef = useRef<HTMLInputElement>(null);
  const inchesInputRef = useRef<HTMLInputElement>(null);

  const [
    waistMeasurementDisplayPreference,
    setWaistMeasurementDisplayPreference
  ] = useState<string>(
    healthCheckAnswers.waistMeasurementDisplayPreference ??
      WaistMeasurementDisplayPreference.Centimetres
  );
  const [waistMeasurementCm, setWaistMeasurementCm] = useState<number | null>(
    healthCheckAnswers.waistMeasurement ?? null
  );
  const [waistMeasurementInches, setWaistMeasurementInches] = useState<
    number | null
  >(round(convertCmToInches(healthCheckAnswers.waistMeasurement), 1));
  const [waistMeasurementError, setWaistMeasurementError] =
    useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const isValid = (): { valid: boolean; errorMessage: string } => {
    let errorMessage = '';

    if (
      (waistMeasurementDisplayPreference as WaistMeasurementDisplayPreference) ===
      WaistMeasurementDisplayPreference.Centimetres
    ) {
      errorMessage = validateCentimetres();
    } else if (
      (waistMeasurementDisplayPreference as WaistMeasurementDisplayPreference) ===
      WaistMeasurementDisplayPreference.Inches
    ) {
      errorMessage = validateInches();
    }

    return {
      valid: errorMessage === '',
      errorMessage: errorMessage
    };
  };

  const validateCentimetres = (): string => {
    let errorMessage = '';
    if (waistMeasurementCm === null) {
      errorMessage = errors.waistMeasurement.required;
    } else if (
      waistMeasurementCm < WaistMeasurementLimits.inCentimetres.min ||
      waistMeasurementCm > WaistMeasurementLimits.inCentimetres.max
    ) {
      errorMessage = errors.waistMeasurement.inCentimetresTooHighOrTooLow;
    }
    return errorMessage;
  };

  const validateInches = (): string => {
    let errorMessage = '';
    if (waistMeasurementInches === null) {
      errorMessage = errors.waistMeasurement.required;
    } else if (
      waistMeasurementInches < WaistMeasurementLimits.inInches.min ||
      waistMeasurementInches > WaistMeasurementLimits.inInches.max
    ) {
      errorMessage = errors.waistMeasurement.inInchesTooHighOrTooLow;
    }
    return errorMessage;
  };

  const handleNext = async (): Promise<SubmitValidationResult> => {
    const { valid, errorMessage } = isValid();
    if (!valid) {
      setWaistMeasurementError(errorMessage);
      setIsPageInError(true);
      return {
        isSubmitValid: false
      };
    }

    await updateHealthCheckAnswers({
      waistMeasurement: waistMeasurementCm,
      waistMeasurementDisplayPreference: waistMeasurementDisplayPreference
    } as IBodyMeasurements);
    return {
      isSubmitValid: true
    };
  };

  function onCentimetresWaistMeasurementChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const waistMeasurementCm = e.target.value;
    const value = convertToNumber(waistMeasurementCm);
    const waistMeasurementInches = convertCmToInches(value);
    setWaistMeasurementInches(waistMeasurementInches);
    setWaistMeasurementCm(round(value, 1));
  }

  function onInchesWaistMeasurementChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const waistMeasurementInches = e.target.value;
    const value = convertToNumber(waistMeasurementInches);
    const waistMeasurementCm = convertInchesToCm(value);
    setWaistMeasurementCm(round(waistMeasurementCm, 1));
    setWaistMeasurementInches(value);
  }

  function onWaistMeasurementDisplayPreferenceChange(
    event: React.MouseEvent<HTMLAnchorElement>
  ) {
    event.preventDefault();
    setWaistMeasurementDisplayPreference((prev: string) => {
      const newDisplayPreference =
        (prev as WaistMeasurementDisplayPreference) ===
        WaistMeasurementDisplayPreference.Centimetres
          ? WaistMeasurementDisplayPreference.Inches
          : WaistMeasurementDisplayPreference.Centimetres;

      const elementToFocus =
        newDisplayPreference === WaistMeasurementDisplayPreference.Inches
          ? inchesInputRef
          : cmInputRef;
      setTimeout(() => {
        elementToFocus.current?.focus({ preventScroll: true });
      }, MEASUREMENT_SWITCHER_FOCUS_DELAY_MS);
      return newDisplayPreference;
    });
  }

  return (
    <>
      {waistMeasurementError && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              {waistMeasurementError && (
                <ErrorSummary.Item
                  href={
                    (waistMeasurementDisplayPreference as WaistMeasurementDisplayPreference) ===
                    WaistMeasurementDisplayPreference.Centimetres
                      ? '#waist-measurement-cm'
                      : '#waist-measurement-in'
                  }
                >
                  {waistMeasurementError}
                </ErrorSummary.Item>
              )}
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      {/* Manually apply error styling to fieldset as it's a custom usage */}
      <div
        className={`nhsuk-form-group ${
          waistMeasurementError ? 'nhsuk-form-group--error' : ''
        }`}
      >
        <Fieldset
          aria-describedby={`${waistMeasurementError ? 'waist-measurement-error' : ''}`}
        >
          <Fieldset.Legend isPageHeading size="l">
            What is your waist measurement?
          </Fieldset.Legend>
          {waistMeasurementError && (
            <ErrorMessage id="waist-measurement-error">
              {waistMeasurementError}
            </ErrorMessage>
          )}
          {(waistMeasurementDisplayPreference as WaistMeasurementDisplayPreference) ===
          WaistMeasurementDisplayPreference.Inches ? (
            <TextInput
              type="text"
              width="4"
              key="waist-measurement-in"
              name="waist-measurement-in"
              label="Inches"
              id="waist-measurement-in"
              inputRef={inchesInputRef}
              inputMode="numeric"
              defaultValue={waistMeasurementInches ?? ''}
              onChangeCapture={onInchesWaistMeasurementChange}
              className={waistMeasurementError && 'nhsuk-input--error'}
            ></TextInput>
          ) : (
            <TextInput
              type="text"
              width="4"
              key="waist-measurement-cm"
              name="waist-measurement-cm"
              label="Centimetres"
              id="waist-measurement-cm"
              inputRef={cmInputRef}
              inputMode="decimal"
              defaultValue={waistMeasurementCm ?? ''}
              onChangeCapture={onCentimetresWaistMeasurementChange}
              className={waistMeasurementError && 'nhsuk-input--error'}
            ></TextInput>
          )}
        </Fieldset>
      </div>
      <p>
        <Link
          id="waist-measurement-switch-link"
          to={`?step=${JourneyStepNames.WaistMeasurementPage}#waist-measurement-switch-link`}
          onClick={onWaistMeasurementDisplayPreferenceChange}
        >
          {(waistMeasurementDisplayPreference as WaistMeasurementDisplayPreference) ===
          WaistMeasurementDisplayPreference.Inches
            ? 'Switch to centimetres'
            : 'Switch to inches'}
        </Link>
      </p>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
