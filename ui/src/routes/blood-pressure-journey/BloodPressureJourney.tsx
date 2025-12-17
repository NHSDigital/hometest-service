import { useRef, useEffect, useCallback } from 'react';
import { create as createBloodPressureStepManager } from './BloodPressureStepManager';
import BloodPressureCheckPage from './steps/BloodPressureCheckPage';
import EnterBloodPressurePage from './steps/EnterBloodPressurePage';
import BloodPressureLocationPage from './steps/BloodPressureLocationPage';
import ConfirmBloodPressurePage from './steps/ConfirmBloodPressurePage';
import ConfirmBloodPressureReadingPage from './steps/ConfirmBloodPressureReadingPage';
import LowBloodPressureSymptomsPage from './steps/low-blood-pressure/LowBloodPressureSymptomsPage';
import LowBloodPressureShutterPage from './steps/low-blood-pressure/LowBloodPressureShutterPage';
import {
  type IBloodPressure,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BloodPressureVeryHighShutterPage from './steps/BloodPressureVeryHighShutterPage';
import NeedBloodPressurePage from './steps/NeedBloodPressurePage';
import {
  useHealthCheck,
  useHealthCheckMutation
} from '../../hooks/healthCheckHooks';
import { type StepManager } from '../StepManager';
import PageLayout from '../../layouts/PageLayout';
import { Redirecting } from '../../lib/pages/redirecting';
import {
  RoutePath,
  getStepUrl,
  JourneyStepNames
} from '../../lib/models/route-paths';
import { usePageTitleContext } from '../../lib/contexts/PageTitleContext';
import scheduleGpUpdateService, {
  GpUpdateReason
} from '../../services/schedule-gp-update-service';
import { bloodPressureChecker } from './blood-pressure-checker';
import { Spinner } from '../../lib/pages/spinner';

export default function BloodPressureJourney() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams({
    step: JourneyStepNames.BloodPressureCheckPage
  });
  const healthCheck = useHealthCheck();
  const updateHealthCheck = useHealthCheckMutation();
  const submitHealthCheck = useHealthCheckMutation();
  const currentStep = searchParams.get('step');
  const { setCurrentStep } = usePageTitleContext();

  const createGpUpdateScheduleIfNeeded = useCallback(
    (nextStep: string) => {
      const highBpShutterStep = getStepUrl(
        RoutePath.BloodPressureJourney,
        JourneyStepNames.BloodPressureVeryHighShutterPage
      );
      const lowBpShutterStep = getStepUrl(
        RoutePath.BloodPressureJourney,
        JourneyStepNames.LowBloodPressureShutterPage
      );
      if (nextStep === highBpShutterStep) {
        void scheduleGpUpdateService.createGpUpdateSchedule(
          healthCheck.data?.id ?? '',
          GpUpdateReason.urgentHighBP
        );
      }
      if (nextStep === lowBpShutterStep) {
        void scheduleGpUpdateService.createGpUpdateSchedule(
          healthCheck.data?.id ?? '',
          GpUpdateReason.urgentLowBP
        );
      }
    },
    [healthCheck]
  );

  useEffect(() => {
    if (updateHealthCheck.isSuccess) {
      updateHealthCheck.reset();

      bloodPressureRef.current = mapToBloodPressure(healthCheck.data!);
      stepManagerRef.current = createBloodPressureStepManager(
        bloodPressureRef.current ?? ''
      );

      const nextStep = stepManagerRef.current.getNextStepUrl(
        RoutePath.BloodPressureJourney,
        currentStep
      );
      createGpUpdateScheduleIfNeeded(nextStep);
      navigate(nextStep);
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
    setCurrentStep,
    createGpUpdateScheduleIfNeeded
  ]);

  useEffect(() => {
    if (submitHealthCheck.isSuccess) {
      submitHealthCheck.reset();
      navigate(RoutePath.TaskListPage);
    }
  }, [navigate, submitHealthCheck]);

  const stepManagerRef = useRef<StepManager>();
  const bloodPressureRef = useRef<IBloodPressure>();

  async function updateHealthCheckAnswers(value: Partial<IBloodPressure>) {
    const newData = {
      ...value,
      isBloodPressureSectionSubmitted: false
    };
    await updateHealthCheck.mutateAsync({ answers: newData });
  }

  async function submitHealthCheckAnswers() {
    await submitHealthCheck.mutateAsync({
      answers: { isBloodPressureSectionSubmitted: true }
    });

    if (bloodPressureChecker.isBloodPressureHigh(bloodPressureRef.current!)) {
      void scheduleGpUpdateService.createGpUpdateSchedule(
        healthCheck.data?.id ?? '',
        GpUpdateReason.highBP
      );
    }
  }

  if (healthCheck.isPending) {
    return <Spinner />;
  }

  if (healthCheck.isSuccess) {
    bloodPressureRef.current = mapToBloodPressure(healthCheck.data!);
    stepManagerRef.current = createBloodPressureStepManager(
      bloodPressureRef.current
    );
  }

  if (healthCheck.isError) {
    return <Redirecting />;
  }

  switch (currentStep) {
    case JourneyStepNames.BloodPressureCheckPage:
      return renderStep(
        <BloodPressureCheckPage
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.BloodPressureLocationPage:
      return renderStep(
        <BloodPressureLocationPage
          healthCheckAnswers={bloodPressureRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.EnterBloodPressurePage:
      return renderStep(
        <EnterBloodPressurePage
          healthCheckAnswers={bloodPressureRef.current!}
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.ConfirmBloodPressureReadingPage:
      return renderStep(
        <ConfirmBloodPressureReadingPage
          healthCheckAnswers={bloodPressureRef.current!}
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.LowBloodPressureSymptomsPage:
      return renderStep(
        <LowBloodPressureSymptomsPage
          healthCheckAnswers={bloodPressureRef.current!}
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.LowBloodPressureShutterPage:
      return renderStep(
        <LowBloodPressureShutterPage
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    case JourneyStepNames.ConfirmBloodPressurePage:
      return renderStep(
        <ConfirmBloodPressurePage
          healthCheckAnswers={bloodPressureRef.current!}
          submitAnswers={submitHealthCheckAnswers}
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    case JourneyStepNames.BloodPressureVeryHighShutterPage:
      return renderStep(
        <BloodPressureVeryHighShutterPage
          healthCheckAnswers={bloodPressureRef.current!}
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    case JourneyStepNames.NeedBloodPressurePage:
      return renderStep(
        <NeedBloodPressurePage
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    default:
      throw new Error(`Page not defined: ${currentStep}`);
  }

  function renderStep(stepComponent: JSX.Element) {
    const backToUrl = (() => {
      switch (currentStep) {
        case JourneyStepNames.BloodPressureCheckPage:
          return RoutePath.TaskListPage;
        case JourneyStepNames.NeedBloodPressurePage:
          return getStepUrl(
            RoutePath.BloodPressureJourney,
            JourneyStepNames.BloodPressureCheckPage
          );
        case JourneyStepNames.LowBloodPressureShutterPage:
        case JourneyStepNames.BloodPressureVeryHighShutterPage:
          return undefined; // No back button
        default:
          return stepManagerRef.current!.getPreviousStepUrl(
            RoutePath.BloodPressureJourney,
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

function mapToBloodPressure(healthCheck: IHealthCheck): IBloodPressure {
  return {
    bloodPressureDiastolic:
      healthCheck.questionnaire?.bloodPressureDiastolic ?? null,
    bloodPressureSystolic:
      healthCheck.questionnaire?.bloodPressureSystolic ?? null,
    bloodPressureLocation:
      healthCheck.questionnaire?.bloodPressureLocation ?? null,
    isBloodPressureSectionSubmitted:
      healthCheck.questionnaire?.isBloodPressureSectionSubmitted,
    lowBloodPressureValuesConfirmed:
      healthCheck.questionnaire?.lowBloodPressureValuesConfirmed ?? null,
    highBloodPressureValuesConfirmed:
      healthCheck.questionnaire?.highBloodPressureValuesConfirmed ?? null,
    hasStrongLowBloodPressureSymptoms:
      healthCheck.questionnaire?.hasStrongLowBloodPressureSymptoms !== undefined
        ? healthCheck.questionnaire.hasStrongLowBloodPressureSymptoms
        : null
  };
}
