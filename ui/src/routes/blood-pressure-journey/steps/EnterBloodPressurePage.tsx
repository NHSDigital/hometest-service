import {
  Fieldset,
  TextInput,
  Details,
  ErrorSummary
} from 'nhsuk-react-components';
import {
  BloodPressureLocation,
  type IBloodPressure,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import React, { useState } from 'react';
import { convertToNumber } from '../../../lib/converters/integer-converter';
import { OneOneOneNumber } from '../../../lib/components/one-one-one-number';
import { ImportantCallout } from '../../../lib/components/important-callout';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import { useAuditEvent } from '../../../hooks/eventAuditHook';
import { bloodPressureChecker } from '../blood-pressure-checker';

interface EnterBloodPressurePageProps {
  readonly healthCheckAnswers: IBloodPressure;
  readonly healthCheck?: IHealthCheck;
  readonly patientId: string;
  readonly updateHealthCheckAnswers: (
    value: Partial<IBloodPressure>
  ) => Promise<void>;
}

export default function EnterBloodPressurePage({
  healthCheckAnswers,
  healthCheck,
  patientId,
  updateHealthCheckAnswers
}: EnterBloodPressurePageProps) {
  const systolicInputId = 'systolic-value';
  const diastolicInputId = 'diastolic-value';
  const diastolicMin = 40;
  const systolicMin = 70;
  const diastolicMax = 200;
  const systolicMax = 300;
  const errorDefinitions = {
    additionalDescriptions: {
      systolicOutOfRange: () => (
        <p>
          Your systolic reading is out of range used by the tool. Check your
          number and try again. If your number is correct call{' '}
          <OneOneOneNumber />
        </p>
      ),
      diastolicOutOfRange: () => (
        <p>
          Your diastolic reading is out of range used by the tool. Check your
          number and try again. If your number is correct call{' '}
          <OneOneOneNumber />
        </p>
      ),
      diastolicAndSystolicOutOfRange: () => (
        <p>
          Your systolic and diastolic readings are out of range used by the
          tool. Check your numbers and try again. If your numbers are correct
          call <OneOneOneNumber />
        </p>
      ),
      diastolicAboveSystolic: () => (
        <p>
          The diastolic reading entered is the same or higher than the systolic
          reading. Check the number and try again. If your reading is correct
          call <OneOneOneNumber />.
        </p>
      )
    },
    systolic: {
      required: 'Enter a systolic reading',
      decimalNum: 'Systolic reading must be a whole number',
      tooLow: 'Systolic reading must be 70 or above',
      tooHigh: 'Systolic reading must be 300 or below'
    },
    diastolic: {
      required: 'Enter a diastolic reading',
      decimalNum: 'Diastolic reading must be a whole number',
      higherThanSystolic:
        'Diastolic reading should be lower than your systolic reading',
      tooLow: 'Diastolic reading must be 40 or above',
      tooHigh: 'Diastolic reading must be 200 or below'
    }
  };

  const [errorBoxDescription, setErrorBoxDescription] =
    useState<JSX.Element | null>(null);
  const [systolicError, setSystolicError] = useState<string | undefined>();
  const [diastolicError, setDiastolicError] = useState<string | undefined>();

  const [systolic, setSystolic] = useState<number | null | undefined>(
    healthCheckAnswers.bloodPressureSystolic
  );
  const [diastolic, setDiastolic] = useState<number | null | undefined>(
    healthCheckAnswers.bloodPressureDiastolic
  );
  const { setIsPageInError } = usePageTitleContext();
  const { triggerAuditEvent } = useAuditEvent();

  const isSystolicValid = () => {
    let errorDescription = null;
    let systolicValidationError = undefined;
    if (systolic === null || systolic === undefined) {
      systolicValidationError = errorDefinitions.systolic.required;
    } else if (!Number.isInteger(systolic)) {
      systolicValidationError = errorDefinitions.systolic.decimalNum;
    } else if (systolic < systolicMin) {
      systolicValidationError = errorDefinitions.systolic.tooLow;
      errorDescription =
        errorDefinitions.additionalDescriptions.systolicOutOfRange;
    } else if (systolic > systolicMax) {
      systolicValidationError = errorDefinitions.systolic.tooHigh;
      errorDescription =
        errorDefinitions.additionalDescriptions.systolicOutOfRange;
    }
    return {
      errorDescription,
      systolicValidationError
    };
  };

  const isDiastolicValid = () => {
    let errorDescription = null;
    let diastolicValidationError = undefined;
    if (diastolic === null || diastolic === undefined) {
      diastolicValidationError = errorDefinitions.diastolic.required;
    } else if (!Number.isInteger(diastolic)) {
      diastolicValidationError = errorDefinitions.diastolic.decimalNum;
    } else if (diastolic < diastolicMin) {
      diastolicValidationError = errorDefinitions.diastolic.tooLow;
      errorDescription =
        errorDefinitions.additionalDescriptions.diastolicOutOfRange;
    } else if (diastolic > diastolicMax) {
      diastolicValidationError = errorDefinitions.diastolic.tooHigh;
      errorDescription =
        errorDefinitions.additionalDescriptions.diastolicOutOfRange;
    } else if (
      systolic !== null &&
      systolic !== undefined &&
      diastolic >= systolic
    ) {
      diastolicValidationError = errorDefinitions.diastolic.higherThanSystolic;
      errorDescription =
        errorDefinitions.additionalDescriptions.diastolicAboveSystolic;
    }

    return {
      errorDescription,
      diastolicValidationError
    };
  };

  const isRangeValid = () => {
    let errorDescription = null;
    if (
      diastolic !== null &&
      diastolic !== undefined &&
      systolic !== null &&
      systolic !== undefined &&
      (diastolic < diastolicMin || diastolic > diastolicMax) &&
      (systolic < systolicMin || systolic > systolicMax)
    ) {
      errorDescription =
        errorDefinitions.additionalDescriptions.diastolicAndSystolicOutOfRange;
    }

    return {
      errorDescription
    };
  };

  function getBloodPressureRouteAuditEventText(
    healthCheckAnswers: IBloodPressure
  ): string {
    if (bloodPressureChecker.isBloodPressureLow(healthCheckAnswers)) {
      return 'Low';
    } else if (
      bloodPressureChecker.isBloodPressureVeryHigh(healthCheckAnswers)
    ) {
      return 'VeryHigh';
    } else {
      return 'Standard';
    }
  }

  const handleNext = async (): Promise<SubmitValidationResult> => {
    const systolicError = isSystolicValid();
    if (systolicError.errorDescription) {
      setErrorBoxDescription(systolicError.errorDescription);
    } else {
      setErrorBoxDescription(null);
    }
    if (systolicError.systolicValidationError) {
      setSystolicError(systolicError.systolicValidationError);
      setIsPageInError(true);
    } else {
      setSystolicError(undefined);
    }

    const diastolicError = isDiastolicValid();
    if (diastolicError.errorDescription) {
      setErrorBoxDescription(diastolicError.errorDescription);
    }
    if (diastolicError.diastolicValidationError) {
      setDiastolicError(diastolicError.diastolicValidationError);
      setIsPageInError(true);
    } else {
      setDiastolicError(undefined);
    }

    const rangeError = isRangeValid();
    if (rangeError.errorDescription) {
      setErrorBoxDescription(rangeError.errorDescription);
    }

    if (
      systolicError.errorDescription ||
      systolicError.systolicValidationError ||
      diastolicError.diastolicValidationError ||
      diastolicError.errorDescription ||
      rangeError.errorDescription
    ) {
      return {
        isSubmitValid: false
      };
    }

    await updateHealthCheckAnswers({
      bloodPressureDiastolic: diastolic,
      bloodPressureSystolic: systolic
    });

    void triggerAuditEvent({
      eventType: AuditEventType.BloodPressureEntered,
      healthCheck,
      patientId,
      details: {
        bpRoute: getBloodPressureRouteAuditEventText({
          ...healthCheckAnswers,
          bloodPressureDiastolic: diastolic,
          bloodPressureSystolic: systolic
        }),
        bpTakenAt: healthCheckAnswers.bloodPressureLocation
      }
    });
    return {
      isSubmitValid: true
    };
  };

  function onSystolicChange(e: React.ChangeEvent<HTMLInputElement>) {
    const systolic = e.target.value;
    const value = convertToNumber(systolic);
    setSystolic(value);
  }

  function onDiastolicChange(e: React.ChangeEvent<HTMLInputElement>) {
    const diastolic = e.target.value;
    const value = convertToNumber(diastolic);
    setDiastolic(value);
  }

  return (
    <>
      {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
      {(systolicError || diastolicError) && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              {errorBoxDescription}
              {systolicError && (
                <ErrorSummary.Item href={`#${systolicInputId}`}>
                  {systolicError}
                </ErrorSummary.Item>
              )}
              {diastolicError && (
                <ErrorSummary.Item href={`#${diastolicInputId}`}>
                  {diastolicError}
                </ErrorSummary.Item>
              )}
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <h1>Taking your blood pressure</h1>
      <p>
        After you take your blood pressure reading, enter it here to continue
        your NHS Health Check.
      </p>
      <p>The information you&apos;ve entered so far has been saved.</p>
      {healthCheckAnswers.bloodPressureLocation ===
        BloodPressureLocation.Monitor && (
        <ImportantCallout>
          <p>
            Take another reading a few minutes after your first reading to check
            it&apos;s accurate.
          </p>
        </ImportantCallout>
      )}
      <Fieldset disableErrorLine={true}>
        <Fieldset.Legend size="m">Enter your reading</Fieldset.Legend>
        <TextInput
          id="systolic-value"
          width={4}
          onChangeCapture={onSystolicChange}
          defaultValue={systolic ?? ''}
          hint="mmHg"
          label="Systolic (the higher number)"
          type="text"
          inputMode="numeric"
          error={systolicError}
          aria-label="Enter your systolic reading in millimeters of mercury"
        ></TextInput>
        <TextInput
          id="diastolic-value"
          width={4}
          onChangeCapture={onDiastolicChange}
          defaultValue={diastolic ?? ''}
          hint="mmHg"
          label="Diastolic (the lower number)"
          type="text"
          inputMode="numeric"
          error={diastolicError}
          aria-label="Enter your diastolic reading in millimeters of mercury"
        ></TextInput>
      </Fieldset>
      <Details>
        <Details.Summary>What do these numbers mean?</Details.Summary>
        <Details.Text>
          <p>
            Your reading is made up of 2 numbers and is measured in millimetres
            of mercury (mmHg).
          </p>
          <p>
            The higher number is the systolic reading. This is the highest level
            your blood pressure reaches when your heart beats.
          </p>
          <p>
            The lower number is the diastolic reading. This is the lowest level
            your blood pressure reaches when your heart relaxes between beats.
          </p>
        </Details.Text>
      </Details>
      {healthCheckAnswers.bloodPressureLocation ===
        BloodPressureLocation.Monitor && (
        <Details>
          <Details.Summary>
            I need help measuring my blood pressure at home
          </Details.Summary>
          <br />
          <Details.Text>
            <p>
              When you&apos;re taking your blood pressure at home, there are
              things you can do to help get an accurate reading.
            </p>
            <p>Try to:</p>
            <ul>
              <li>sit on an upright chair with a back</li>
              <li>place your feet flat on the floor</li>
              <li>rest your arm on a table and relax your hand and arm</li>
              <li>
                wear something with short sleeves so the cuff does not go over
                clothes
              </li>
              <li>relax, breathe normally and do not talk during the test</li>
              <li>
                take another reading a few minutes after your first reading to
                check it&apos;s accurate
              </li>
            </ul>
          </Details.Text>
        </Details>
      )}
      <FormButton onButtonClick={handleNext}>Continue</FormButton>
    </>
  );
}
