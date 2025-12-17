import { useEffect, useRef } from 'react';
import {
  type HeightDisplayPreference,
  type IBodyMeasurements,
  type WaistMeasurementDisplayPreference,
  type WeightDisplayPreference,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { create as createBodyMeasurementsStepManager } from './BodyMeasurementsStepManager';
import { useNavigate } from 'react-router';
import HeightPage from './steps/HeightPage';
import CheckYourAnswersPage from './steps/CheckYourAnswersPage';
import WeightPage from './steps/WeightPage';
import { useSearchParams } from 'react-router-dom';
import { mapToEnum } from '../../lib/converters/enum-converter';
import {
  useHealthCheck,
  useHealthCheckMutation
} from '../../hooks/healthCheckHooks';
import { type StepManager } from '../StepManager';
import PageLayout from '../../layouts/PageLayout';
import { Redirecting } from '../../lib/pages/redirecting';
import { JourneyStepNames, RoutePath } from '../../lib/models/route-paths';
import { usePageTitleContext } from '../../lib/contexts/PageTitleContext';
import MeasureYourWaistPage from './steps/MeasureYourWaistPage';
import WaistMeasurementPage from './steps/WaistMeasurementPage';
import DiabetesShutterPage from './steps/DiabetesShutterPage';
import { Spinner } from '../../lib/pages/spinner';

export default function BodyMeasurementsJourney() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams({
    step: JourneyStepNames.HeightPage
  });
  const healthCheck = useHealthCheck();
  const updateHealthCheck = useHealthCheckMutation();
  const submitHealthCheck = useHealthCheckMutation();
  const currentStep = searchParams.get('step');
  const { setCurrentStep } = usePageTitleContext();

  useEffect(() => {
    if (updateHealthCheck.isSuccess) {
      updateHealthCheck.reset();

      bodyMeasurementsRef.current = mapToBodyMeasurements(healthCheck.data);
      leicesterRiskScoreRef.current = healthCheck.data!.questionnaireScores
        ?.leicesterRiskScore as number;
      stepManagerRef.current = createBodyMeasurementsStepManager();

      navigate(
        stepManagerRef.current.getNextStepUrl(
          RoutePath.BodyMeasurementsJourney,
          currentStep
        )
      );
    }
    setCurrentStep(currentStep ?? undefined);
    return () => {
      setCurrentStep(undefined);
    };
  }, [
    navigate,
    updateHealthCheck,
    healthCheck.data,
    currentStep,
    setCurrentStep
  ]);

  useEffect(() => {
    if (submitHealthCheck.isSuccess) {
      submitHealthCheck.reset();
      navigate(RoutePath.TaskListPage);
    }
  }, [navigate, submitHealthCheck]);

  const stepManagerRef = useRef<StepManager>();
  const bodyMeasurementsRef = useRef<IBodyMeasurements>();
  const leicesterRiskScoreRef = useRef<number>();

  async function updateHealthCheckAnswers(
    value: Partial<IBodyMeasurements>
  ): Promise<void> {
    const newData = {
      ...bodyMeasurementsRef.current,
      ...value,
      isBodyMeasurementsSectionSubmitted: false
    };
    await updateHealthCheck.mutateAsync({ answers: newData });
  }

  async function submitHealthCheckAnswers() {
    await submitHealthCheck.mutateAsync({
      answers: { isBodyMeasurementsSectionSubmitted: true }
    });
  }

  if (healthCheck.isPending) {
    return <Spinner />;
  }

  if (healthCheck.isSuccess) {
    bodyMeasurementsRef.current = mapToBodyMeasurements(healthCheck.data);
    leicesterRiskScoreRef.current = healthCheck.data!.questionnaireScores
      ?.leicesterRiskScore as number;
    stepManagerRef.current = createBodyMeasurementsStepManager();
  }

  if (healthCheck.isError) {
    return <Redirecting />;
  }

  switch (currentStep) {
    case JourneyStepNames.HeightPage:
      return renderStep(
        <HeightPage
          healthCheckAnswers={bodyMeasurementsRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.WeightPage:
      return renderStep(
        <WeightPage
          healthCheckAnswers={bodyMeasurementsRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.MeasureYourWaistPage:
      return renderStep(
        <MeasureYourWaistPage
          onContinue={() =>
            navigate(
              stepManagerRef.current!.getNextStepUrl(
                RoutePath.BodyMeasurementsJourney,
                currentStep
              )
            )
          }
        />
      );
    case JourneyStepNames.WaistMeasurementPage:
      return renderStep(
        <WaistMeasurementPage
          healthCheckAnswers={bodyMeasurementsRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.DiabetesShutterPage:
      return renderStep(<DiabetesShutterPage />);
    case JourneyStepNames.CheckYourAnswersBodyMeasurementsPage:
      return renderStep(
        <CheckYourAnswersPage
          healthCheckAnswers={bodyMeasurementsRef.current!}
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
          submitAnswers={submitHealthCheckAnswers}
        />
      );
    default:
      throw new Error(`Page not defined: ${currentStep}`);
  }

  function renderStep(stepComponent: JSX.Element) {
    const backToUrl = (() => {
      switch (currentStep) {
        case JourneyStepNames.HeightPage:
          return RoutePath.TaskListPage;
        case JourneyStepNames.DiabetesShutterPage:
          return undefined; // No back button
        default:
          return stepManagerRef.current!.getPreviousStepUrl(
            RoutePath.BodyMeasurementsJourney,
            currentStep
          );
      }
    })();

    return (
      <PageLayout
        backToUrl={backToUrl}
        displayNhsAppServicesBackButton={backToUrl === undefined}
      >
        {stepComponent}
      </PageLayout>
    );
  }
}

function mapToBodyMeasurements(
  healthCheck: IHealthCheck | undefined
): IBodyMeasurements {
  return {
    height: healthCheck?.questionnaire?.height ?? null,
    weight: healthCheck?.questionnaire?.weight ?? null,
    waistMeasurement: healthCheck?.questionnaire?.waistMeasurement ?? null,
    heightDisplayPreference: mapToEnum<HeightDisplayPreference>(
      healthCheck?.questionnaire?.heightDisplayPreference
    ),
    weightDisplayPreference: mapToEnum<WeightDisplayPreference>(
      healthCheck?.questionnaire?.weightDisplayPreference
    ),
    waistMeasurementDisplayPreference:
      mapToEnum<WaistMeasurementDisplayPreference>(
        healthCheck?.questionnaire?.waistMeasurementDisplayPreference
      ),
    isBodyMeasurementsSectionSubmitted:
      healthCheck?.questionnaire?.isBodyMeasurementsSectionSubmitted
  };
}
