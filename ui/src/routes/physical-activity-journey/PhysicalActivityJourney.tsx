import { useEffect, useRef } from 'react';
import {
  type ExerciseHours,
  type IPhysicalActivity,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { create as createPhysicalActivityStepManager } from './PhysicalActivityStepManager';
import { useNavigate } from 'react-router';
import HoursExercisedPage from './steps/HoursExercisedPage';
import HoursWalkedPage from './steps/HoursWalkedPage';
import HoursCycledPage from './steps/HoursCycledPage';
import WorkActivityPage from './steps/WorkActivityPage';
import EverydayMovementPage from './steps/EverydayMovementPage';
import HoursHouseworkPage from './steps/HoursHouseworkPage';
import HoursGardeningPage from './steps/HoursGardeningPage';
import WalkingPacePage from './steps/WalkingPacePage';
import CheckYourAnswersPage from './steps/CheckYourAnswersPage';
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
import { Spinner } from '../../lib/pages/spinner';

export default function PhysicalActivityJourney() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams({
    step: JourneyStepNames.HoursExercisedPage
  });
  const healthCheck = useHealthCheck();
  const updateHealthCheck = useHealthCheckMutation();
  const submitHealthCheck = useHealthCheckMutation();
  const currentStep = searchParams.get('step');
  const { setCurrentStep } = usePageTitleContext();
  useEffect(() => {
    if (updateHealthCheck.isSuccess) {
      updateHealthCheck.reset();

      activityRef.current = mapToPhysicalActivity(healthCheck.data);
      stepManagerRef.current = createPhysicalActivityStepManager();

      navigate(
        stepManagerRef.current.getNextStepUrl(
          RoutePath.PhysicalActivityJourney,
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
  const activityRef = useRef<IPhysicalActivity>();

  async function updateHealthCheckAnswers(
    value: Partial<IPhysicalActivity>
  ): Promise<void> {
    const newData = {
      ...value,
      isPhysicalActivitySectionSubmitted: false
    };
    await updateHealthCheck.mutateAsync({ answers: newData });
  }

  async function submitHealthCheckAnswers() {
    await submitHealthCheck.mutateAsync({
      answers: {
        isPhysicalActivitySectionSubmitted: true
      }
    });
  }

  if (healthCheck.isPending) {
    return <Spinner />;
  }

  if (healthCheck.isSuccess) {
    activityRef.current = mapToPhysicalActivity(healthCheck.data);
    stepManagerRef.current = createPhysicalActivityStepManager();
  }

  if (healthCheck.isError) {
    return <Redirecting />;
  }

  switch (currentStep) {
    case JourneyStepNames.HoursExercisedPage:
      return renderStep(
        <HoursExercisedPage
          healthCheckAnswers={activityRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.HoursWalkedPage:
      return renderStep(
        <HoursWalkedPage
          healthCheckAnswers={activityRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.HoursCycledPage:
      return renderStep(
        <HoursCycledPage
          healthCheckAnswers={activityRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

    case JourneyStepNames.WorkActivityPage:
      return renderStep(
        <WorkActivityPage
          healthCheckAnswers={activityRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

    case JourneyStepNames.EverydayMovementPage:
      return renderStep(
        <EverydayMovementPage
          nextStepUrl={stepManagerRef.current!.getNextStepUrl(
            RoutePath.PhysicalActivityJourney,
            JourneyStepNames.EverydayMovementPage
          )}
        />
      );

    case JourneyStepNames.HoursHouseworkPage:
      return renderStep(
        <HoursHouseworkPage
          healthCheckAnswers={activityRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

    case JourneyStepNames.HoursGardeningPage:
      return renderStep(
        <HoursGardeningPage
          healthCheckAnswers={activityRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

    case JourneyStepNames.WalkingPacePage:
      return renderStep(
        <WalkingPacePage
          healthCheckAnswers={activityRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

    case JourneyStepNames.CheckYourAnswersPagePhysicalActivity:
      return renderStep(
        <CheckYourAnswersPage
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
          healthCheckAnswers={activityRef.current!}
          submitAnswers={submitHealthCheckAnswers}
        />
      );
    default:
      throw new Error(`Page not defined: ${currentStep}`);
  }

  function renderStep(stepComponent: JSX.Element) {
    const backToUrl =
      currentStep === JourneyStepNames.HoursExercisedPage
        ? RoutePath.TaskListPage
        : stepManagerRef.current!.getPreviousStepUrl(
            RoutePath.PhysicalActivityJourney,
            currentStep
          );

    return <PageLayout backToUrl={backToUrl}>{stepComponent}</PageLayout>;
  }
}

function mapToPhysicalActivity(
  healthCheck: IHealthCheck | undefined
): IPhysicalActivity {
  return {
    cycleHours: mapToEnum<ExerciseHours>(
      healthCheck?.questionnaire?.cycleHours as string
    ),
    exerciseHours: mapToEnum<ExerciseHours>(
      healthCheck?.questionnaire?.exerciseHours as string
    ),
    gardeningHours: mapToEnum<ExerciseHours>(
      healthCheck?.questionnaire?.gardeningHours as string
    ),
    houseworkHours: mapToEnum<ExerciseHours>(
      healthCheck?.questionnaire?.houseworkHours as string
    ),
    walkHours: mapToEnum<ExerciseHours>(
      healthCheck?.questionnaire?.walkHours as string
    ),
    walkPace: healthCheck?.questionnaire?.walkPace ?? null,
    workActivity: healthCheck?.questionnaire?.workActivity ?? null,
    isPhysicalActivitySectionSubmitted:
      healthCheck?.questionnaire?.isPhysicalActivitySectionSubmitted
  };
}
