import {
  type IBodyMeasurements,
  WeightDisplayPreference
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
  convertKgToLbsAndStones,
  convertLbsAndStonesToKg
} from '../../../lib/converters/body-measurements-converter';
import { JourneyStepNames } from '../../../lib/models/route-paths';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import { MEASUREMENT_SWITCHER_FOCUS_DELAY_MS } from '../focus-helper';

const WeightLimits = {
  inStones: {
    min: 4,
    max: 50
  },
  inPounds: {
    min: 0,
    max: 13
  },
  inKilograms: {
    min: 25.4,
    max: 317.5
  }
};

interface WeightPageProps {
  healthCheckAnswers: IBodyMeasurements;
  updateHealthCheckAnswers: (
    value: Partial<IBodyMeasurements>
  ) => Promise<void>;
}

export default function WeightPage({
  healthCheckAnswers,
  updateHealthCheckAnswers
}: Readonly<WeightPageProps>) {
  const errors = {
    weight: {
      required: 'Enter your weight',
      inKgTooHighOrTooLow: `Weight must be between ${WeightLimits.inKilograms.min}kg and ${WeightLimits.inKilograms.max}kg`,
      inStTooHighOrTooLow: `Weight must be between ${WeightLimits.inStones.min} stone and ${WeightLimits.inStones.max} stone`,
      inStPoundsOutsideLimits: `Pounds must be between ${WeightLimits.inPounds.min} and ${WeightLimits.inPounds.max}`,
      inStStonesDecimalPlace: 'Stone must be in whole numbers',
      inStPoundsDecimalPlace: 'Pounds must be in whole numbers'
    }
  };

  const stoneInputRef = useRef<HTMLInputElement>(null);
  const kgInputRef = useRef<HTMLInputElement>(null);

  const [weightDisplayPreference, setWeightDisplayPreference] =
    useState<WeightDisplayPreference>(
      healthCheckAnswers.weightDisplayPreference ??
        WeightDisplayPreference.Kilograms
    );
  const [weightKg, setWeightKg] = useState<number | null | undefined>(
    healthCheckAnswers.weight
  );
  const [weightStones, setWeightStones] = useState<number | null | undefined>(
    convertKgToLbsAndStones(healthCheckAnswers.weight).stones
  );
  const [weightPounds, setWeightPounds] = useState<number | null | undefined>(
    convertKgToLbsAndStones(healthCheckAnswers.weight).pounds
  );
  const [weightError, setWeightError] = useState<string>('');
  const { setIsPageInError } = usePageTitleContext();

  const isValid = (): { valid: boolean; errorMessage: string } => {
    let errorMessage = '';

    if (weightDisplayPreference === WeightDisplayPreference.Kilograms) {
      errorMessage = validateKilograms();
    } else if (
      weightDisplayPreference === WeightDisplayPreference.StonesAndPounds
    ) {
      errorMessage = validateStoneAndPounds();
    }

    return {
      valid: errorMessage === '',
      errorMessage: errorMessage
    };
  };

  const validateKilograms = (): string => {
    let errorMessage = '';

    if (weightKg === null || weightKg === undefined) {
      errorMessage = errors.weight.required;
    } else if (
      weightKg < WeightLimits.inKilograms.min ||
      weightKg > WeightLimits.inKilograms.max
    ) {
      errorMessage = errors.weight.inKgTooHighOrTooLow;
    }
    return errorMessage;
  };

  const validateStoneAndPounds = (): string => {
    let errorMessage = '';
    let pounds = weightPounds;
    pounds ??= 0;

    if (weightStones === null || weightStones === undefined) {
      errorMessage = errors.weight.required;
    } else if (
      pounds < WeightLimits.inPounds.min ||
      pounds > WeightLimits.inPounds.max
    ) {
      errorMessage = errors.weight.inStPoundsOutsideLimits;
    } else if (!Number.isSafeInteger(weightStones)) {
      errorMessage = errors.weight.inStStonesDecimalPlace;
    } else if (!Number.isSafeInteger(pounds)) {
      errorMessage = errors.weight.inStPoundsDecimalPlace;
    } else if (
      weightStones < WeightLimits.inStones.min ||
      weightStones > WeightLimits.inStones.max ||
      (weightStones >= WeightLimits.inStones.max &&
        pounds > WeightLimits.inPounds.min)
    ) {
      errorMessage = errors.weight.inStTooHighOrTooLow;
    }
    return errorMessage;
  };

  const handleNext = async (): Promise<SubmitValidationResult> => {
    const { valid, errorMessage } = isValid();
    if (!valid) {
      setWeightError(errorMessage);
      setIsPageInError(true);
      return {
        isSubmitValid: false
      };
    }

    await updateHealthCheckAnswers({
      weight: weightKg,
      weightDisplayPreference: weightDisplayPreference
    } as IBodyMeasurements);
    return {
      isSubmitValid: true
    };
  };

  function onKilogramsWeightChange(e: React.ChangeEvent<HTMLInputElement>) {
    const weight = e.target.value;
    const value = round(convertToNumber(weight), 1);
    const { stones, pounds } = convertKgToLbsAndStones(convertToNumber(weight));
    setWeightStones(stones);
    setWeightPounds(pounds);
    setWeightKg(value);
  }

  function onStonesWeightChange(e: React.ChangeEvent<HTMLInputElement>) {
    const weightStones = e.target.value;
    const value = round(convertToNumber(weightStones), 1);
    const weightKg = round(convertLbsAndStonesToKg(value, weightPounds), 1);
    setWeightKg(weightKg);
    setWeightStones(value);
  }

  function onPoundsWeightChange(e: React.ChangeEvent<HTMLInputElement>) {
    const weightPounds = e.target.value;
    const value = convertToNumber(String(weightPounds));
    const weightKg = round(convertLbsAndStonesToKg(weightStones, value), 1);
    setWeightKg(weightKg);
    setWeightPounds(value);
  }

  function onWeightDisplayPreferenceChange(
    event: React.MouseEvent<HTMLAnchorElement>
  ) {
    event.preventDefault();
    setWeightDisplayPreference((prev: WeightDisplayPreference) => {
      const newDisplayPreference =
        prev === WeightDisplayPreference.Kilograms
          ? WeightDisplayPreference.StonesAndPounds
          : WeightDisplayPreference.Kilograms;

      const elementToFocus =
        newDisplayPreference === WeightDisplayPreference.StonesAndPounds
          ? stoneInputRef
          : kgInputRef;
      setTimeout(() => {
        elementToFocus.current?.focus({ preventScroll: true });
      }, MEASUREMENT_SWITCHER_FOCUS_DELAY_MS);
      return newDisplayPreference;
    });
  }

  const getErrorHref = () => {
    if (weightDisplayPreference === WeightDisplayPreference.Kilograms) {
      return '#weight-kg';
    } else if (weightError.toLowerCase().includes('pounds')) {
      return '#weight-pounds';
    } else {
      return '#weight-stone';
    }
  };

  const getSwitchUnitText = (): {
    displayText: string;
    accessibilityText: string;
  } => {
    if (weightDisplayPreference === WeightDisplayPreference.StonesAndPounds) {
      return {
        displayText: 'Switch to kilograms',
        accessibilityText: 'Switch to kilograms'
      };
    } else {
      return {
        displayText: 'Switch to stone and pounds',
        accessibilityText: 'Switch to stone and pounds'
      };
    }
  };

  return (
    <>
      {weightError && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              {weightError && (
                <ErrorSummary.Item href={getErrorHref()}>
                  {weightError}
                </ErrorSummary.Item>
              )}
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <h1>Enter your weight</h1>
      <p>
        An accurate measurement is important. If you have digital scales, use
        these to check your weight. Some pharmacies and gyms have scales where
        you can check for free.
      </p>
      {/* Manually apply error styling to fieldset as it's a custom usage */}
      <div
        className={`nhsuk-form-group ${
          weightError ? 'nhsuk-form-group--error' : ''
        }`}
      >
        <Fieldset {...(weightError && { 'aria-describedby': 'weight-error' })}>
          <Fieldset.Legend size="m">What is your weight?</Fieldset.Legend>
          {weightError && (
            <ErrorMessage id="weight-error">{weightError}</ErrorMessage>
          )}
          {weightDisplayPreference ===
          WeightDisplayPreference.StonesAndPounds ? (
            <div className="app-multiple-inputs__group">
              <div className="app-multiple-inputs__item">
                <TextInput
                  type="text"
                  width="4"
                  label="Stone"
                  name="weight-stone"
                  id="weight-stone"
                  inputRef={stoneInputRef}
                  inputMode="numeric"
                  defaultValue={weightStones ?? ''}
                  onChangeCapture={onStonesWeightChange}
                  className={weightError && 'nhsuk-input--error'}
                ></TextInput>
              </div>
              <div className="app-multiple-inputs__item">
                <TextInput
                  type="text"
                  width="4"
                  label="Pounds"
                  name="weight-pounds"
                  id="weight-pounds"
                  inputMode="numeric"
                  defaultValue={weightPounds ?? ''}
                  onChangeCapture={onPoundsWeightChange}
                  className={weightError && 'nhsuk-input--error'}
                ></TextInput>
              </div>
            </div>
          ) : (
            <TextInput
              type="text"
              width="4"
              name="weight-kg"
              label="Kilograms"
              id="weight-kg"
              inputRef={kgInputRef}
              inputMode="decimal"
              defaultValue={weightKg ?? ''}
              onChangeCapture={onKilogramsWeightChange}
              className={weightError && 'nhsuk-input--error'}
            ></TextInput>
          )}
        </Fieldset>
      </div>
      <p>
        <Link
          id="weight-switch-link"
          to={`?step=${JourneyStepNames.WeightPage}#weight-switch-link`}
          onClick={onWeightDisplayPreferenceChange}
          aria-label={getSwitchUnitText().accessibilityText}
        >
          {getSwitchUnitText().displayText}
        </Link>
      </p>
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
