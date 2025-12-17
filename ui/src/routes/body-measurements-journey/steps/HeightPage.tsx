import {
  TextInput,
  ErrorSummary,
  Fieldset,
  ErrorMessage
} from 'nhsuk-react-components';
import {
  HeightDisplayPreference,
  type IBodyMeasurements
} from '@dnhc-health-checks/shared';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  convertToNumber,
  round
} from '../../../lib/converters/integer-converter';
import {
  convertCmToFtAndInches,
  convertFtToCm
} from '../../../lib/converters/body-measurements-converter';
import { JourneyStepNames } from '../../../lib/models/route-paths';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import { MEASUREMENT_SWITCHER_FOCUS_DELAY_MS } from '../focus-helper';

const HeightLimits = {
  inFeetAndInches: {
    min: { ft: 4, inch: 7 },
    max: { ft: 8, inch: 0 }
  },
  inInches: {
    min: 0,
    max: 11
  },
  inCentimetres: {
    min: 139.7,
    max: 243.8
  }
};

interface HeightPageProps {
  healthCheckAnswers: IBodyMeasurements;
  updateHealthCheckAnswers: (
    value: Partial<IBodyMeasurements>
  ) => Promise<void>;
}

export default function HeightPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: HeightPageProps) {
  const errors = {
    height: {
      required: 'Enter your height',
      inCmTooHighOrTooLow: `Height must be between ${HeightLimits.inCentimetres.min}cm and ${HeightLimits.inCentimetres.max}cm`,
      inFtTooHighOrTooLow: `Height must be between ${HeightLimits.inFeetAndInches.min.ft} feet ${HeightLimits.inFeetAndInches.min.inch} inches and ${HeightLimits.inFeetAndInches.max.ft} feet`,
      inFtInchesOutsideLimits: `Inches must be between ${HeightLimits.inInches.min} and ${HeightLimits.inInches.max}`,
      inFtFeetOutsideLimits: `Feet must be between ${HeightLimits.inFeetAndInches.min.ft} and ${HeightLimits.inFeetAndInches.max.ft}`,
      inFtInchesDecimalPlace: 'Inches must be in whole numbers',
      inFtFeetDecimalPlace: 'Feet must be in whole numbers'
    }
  };

  const cmInputRef = useRef<HTMLInputElement>(null);
  const feetInputRef = useRef<HTMLInputElement>(null);

  const [heightDisplayPreference, setHeightDisplayPreference] =
    useState<string>(
      healthCheckAnswers.heightDisplayPreference ??
        HeightDisplayPreference.Centimetres
    );
  const [heightCm, setHeightCm] = useState<number | null | undefined>(
    healthCheckAnswers.height ?? null
  );
  const [heightFeet, setHeightFeet] = useState<number | null | undefined>(
    convertCmToFtAndInches(healthCheckAnswers.height).ft
  );
  const [heightInches, setHeightInches] = useState<number | null | undefined>(
    convertCmToFtAndInches(healthCheckAnswers.height).inch
  );
  const [heightError, setHeightError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const isValid = (): { valid: boolean; errorMessage: string } => {
    let errorMessage = '';

    if (
      (heightDisplayPreference as HeightDisplayPreference) ===
      HeightDisplayPreference.Centimetres
    ) {
      errorMessage = validateCentimetres();
    } else if (
      (heightDisplayPreference as HeightDisplayPreference) ===
      HeightDisplayPreference.FeetAndInches
    ) {
      errorMessage = validateFeetAndInches();
    }

    return {
      valid: errorMessage === '',
      errorMessage: errorMessage
    };
  };

  const validateCentimetres = (): string => {
    let errorMessage = '';
    if (heightCm === null || heightCm === undefined) {
      errorMessage = errors.height.required;
    } else if (
      heightCm < HeightLimits.inCentimetres.min ||
      heightCm > HeightLimits.inCentimetres.max
    ) {
      errorMessage = errors.height.inCmTooHighOrTooLow;
    }
    return errorMessage;
  };

  const validateFeetAndInches = (): string => {
    let errorMessage = '';
    const inches = heightInches ?? 0;

    if (heightFeet === null || heightFeet === undefined) {
      errorMessage = errors.height.required;
    } else if (
      heightFeet < HeightLimits.inFeetAndInches.min.ft ||
      heightFeet > HeightLimits.inFeetAndInches.max.ft
    ) {
      errorMessage = errors.height.inFtFeetOutsideLimits;
    } else if (
      inches < HeightLimits.inInches.min ||
      inches > HeightLimits.inInches.max
    ) {
      errorMessage = errors.height.inFtInchesOutsideLimits;
    } else if (!Number.isSafeInteger(heightFeet)) {
      errorMessage = errors.height.inFtFeetDecimalPlace;
    } else if (!Number.isSafeInteger(inches)) {
      errorMessage = errors.height.inFtInchesDecimalPlace;
    } else if (
      (heightFeet <= HeightLimits.inFeetAndInches.min.ft &&
        inches < HeightLimits.inFeetAndInches.min.inch) ||
      (heightFeet >= HeightLimits.inFeetAndInches.max.ft &&
        inches > HeightLimits.inFeetAndInches.max.inch)
    ) {
      errorMessage = errors.height.inFtTooHighOrTooLow;
    }
    return errorMessage;
  };

  const handleNext = async (): Promise<SubmitValidationResult> => {
    const { valid, errorMessage } = isValid();
    if (!valid) {
      setHeightError(errorMessage);
      setIsPageInError(true);
      return {
        isSubmitValid: false
      };
    }
    await updateHealthCheckAnswers({
      height: heightCm,
      heightDisplayPreference: heightDisplayPreference
    } as IBodyMeasurements);
    return {
      isSubmitValid: true
    };
  };

  function onCentimetresHeightChange(e: React.ChangeEvent<HTMLInputElement>) {
    const height = e.target.value;
    const value = round(convertToNumber(height), 1);
    const { ft, inch } = convertCmToFtAndInches(value);
    setHeightFeet(ft);
    setHeightInches(inch);
    setHeightCm(value);
  }

  function onFeetHeightChange(e: React.ChangeEvent<HTMLInputElement>) {
    const heightFeet = e.target.value;
    const value = convertToNumber(heightFeet);
    const heightCm = round(convertFtToCm(value, heightInches), 1);
    setHeightCm(heightCm);
    setHeightFeet(value);
  }

  function onInchesHeightChange(e: React.ChangeEvent<HTMLInputElement>) {
    const heightInches = e.target.value;
    const value = convertToNumber(heightInches);
    const heightCm = round(convertFtToCm(heightFeet, value), 1);
    setHeightCm(heightCm);
    setHeightInches(value);
  }

  function onHeightDisplayPreferenceChange(
    event: React.MouseEvent<HTMLAnchorElement>
  ) {
    event.preventDefault();
    setHeightDisplayPreference((prev: string) => {
      const newDisplayPreference =
        (prev as HeightDisplayPreference) ===
        HeightDisplayPreference.Centimetres
          ? HeightDisplayPreference.FeetAndInches
          : HeightDisplayPreference.Centimetres;

      const elementToFocus =
        newDisplayPreference === HeightDisplayPreference.FeetAndInches
          ? feetInputRef
          : cmInputRef;
      setTimeout(() => {
        elementToFocus.current?.focus({ preventScroll: true });
      }, MEASUREMENT_SWITCHER_FOCUS_DELAY_MS);
      return newDisplayPreference;
    });
  }

  const getErrorHref = () => {
    if (
      (heightDisplayPreference as HeightDisplayPreference) ===
      HeightDisplayPreference.Centimetres
    ) {
      return '#cm';
    } else if (heightError.toLowerCase().includes('inches')) {
      return '#inches';
    } else {
      return '#feet';
    }
  };

  const getSwitchUnitText = (): {
    displayText: string;
    accessibilityText: string;
  } => {
    if (
      (heightDisplayPreference as HeightDisplayPreference) ===
      HeightDisplayPreference.FeetAndInches
    ) {
      return {
        displayText: 'Switch to centimetres',
        accessibilityText: 'Switch to centimetres'
      };
    } else {
      return {
        displayText: 'Switch to feet and inches',
        accessibilityText: 'Switch to feet and inches'
      };
    }
  };

  return (
    <>
      {heightError && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              {heightError && (
                <ErrorSummary.Item href={getErrorHref()}>
                  {heightError}
                </ErrorSummary.Item>
              )}
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <h1>Enter your height</h1>
      <p>
        An accurate measurement is important. This helps to work out if you’re a
        healthy weight.
      </p>
      <p>
        You can measure your height at home with a measuring tape. Some
        pharmacies and gyms have machines to measure your height.
      </p>
      {/* Manually apply error styling to fieldset as it's a custom usage */}
      <div
        className={`nhsuk-form-group ${
          heightError ? 'nhsuk-form-group--error' : ''
        }`}
      >
        <Fieldset {...(heightError && { 'aria-describedby': 'height-error' })}>
          <Fieldset.Legend size="m">What is your height?</Fieldset.Legend>
          {heightError && (
            <ErrorMessage id="height-error">{heightError}</ErrorMessage>
          )}
          {(heightDisplayPreference as HeightDisplayPreference) ===
          HeightDisplayPreference.FeetAndInches ? (
            <>
              <div className="app-multiple-inputs__group">
                <div className="app-multiple-inputs__item">
                  <TextInput
                    type="text"
                    width="4"
                    label="Feet"
                    name="feet"
                    id="feet"
                    inputRef={feetInputRef}
                    inputMode="numeric"
                    defaultValue={heightFeet ?? ''}
                    onChangeCapture={onFeetHeightChange}
                    className={heightError && 'nhsuk-input--error'}
                  ></TextInput>
                </div>
                <div className="app-multiple-inputs__item">
                  <TextInput
                    type="text"
                    width="4"
                    label="Inches"
                    name="inches"
                    id="inches"
                    inputMode="numeric"
                    defaultValue={heightInches ?? ''}
                    onChangeCapture={onInchesHeightChange}
                    className={heightError && 'nhsuk-input--error'}
                  ></TextInput>
                </div>
              </div>
            </>
          ) : (
            <TextInput
              type="text"
              width="4"
              label="Centimetres"
              id="cm"
              inputMode="decimal"
              inputRef={cmInputRef}
              defaultValue={heightCm ?? ''}
              onChangeCapture={onCentimetresHeightChange}
              className={heightError && 'nhsuk-input--error'}
            ></TextInput>
          )}
        </Fieldset>
      </div>
      <p>
        <Link
          id="height-switch-link"
          to={`?step=${JourneyStepNames.HeightPage}#height-switch-link`}
          onClick={onHeightDisplayPreferenceChange}
          aria-label={getSwitchUnitText().accessibilityText}
        >
          {getSwitchUnitText().displayText}
        </Link>
      </p>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
