import {
  type IAlcoholConsumption,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { create as createAlcoholConsumptionStepManager } from './AlcoholConsumptionStepManager';
import { useNavigate } from 'react-router';
import AlcoholQuestionPage from './steps/AlcoholQuestionPage';
import CheckYourAnswersPage from './steps/CheckYourAnswersPage';
import AlcoholTypicalUnitsPage from './steps/AlcoholTypicalUnitsPage';
import { useSearchParams } from 'react-router-dom';
import AlcoholOftenPage from './steps/AlcoholOftenPage';
import AlcoholOccasionUnitsPage from './steps/AlcoholOccasionUnitsPage';
import AlcoholStopPage from './steps/AlcoholStopPage';
import AlcoholFailPage from './steps/AlcoholFailPage';
import AlcoholMorningDrinkPage from './steps/AlcoholMorningDrinkPage';
import AlcoholGuiltPage from './steps/AlcoholGuiltPage';
import AlcoholMemoryLossPage from './steps/AlcoholMemoryLossPage';
import AlcoholPersonInjuredPage from './steps/AlcoholPersonInjuredPage';
import AlcoholConcernedRelativePage from './steps/AlcoholConcernedRelativePage';
import { type StepManager } from '../StepManager';
import {
  useHealthCheck,
  useHealthCheckMutation
} from '../../hooks/healthCheckHooks';
import { useEffect, useRef } from 'react';
import { mapToAlcoholConsumption } from './mapper';
import PageLayout from '../../layouts/PageLayout';
import { Redirecting } from '../../lib/pages/redirecting';
import { JourneyStepNames, RoutePath } from '../../lib/models/route-paths';
import { usePageTitleContext } from '../../lib/contexts/PageTitleContext';
import scheduleGpUpdateService, {
  GpUpdateReason
} from '../../services/schedule-gp-update-service';
import { Spinner } from '../../lib/pages/spinner';

export default function AlcoholConsumptionJourney() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams({
    step: JourneyStepNames.AlcoholQuestionPage
  });
  const healthCheck = useHealthCheck();
  const updateHealthCheck = useHealthCheckMutation();
  const submitHealthCheck = useHealthCheckMutation();
  const currentStep = searchParams.get('step');
  const { setCurrentStep } = usePageTitleContext();
  useEffect(() => {
    if (updateHealthCheck.isSuccess) {
      updateHealthCheck.reset();

      alcoholConsumptionRef.current = mapToAlcoholConsumption(
        healthCheck.data as IHealthCheck
      );
      inProgressAuditScoreRef.current =
        healthCheck.data!.questionnaireScores?.inProgressAuditScore ??
        undefined;
      stepManagerRef.current = createAlcoholConsumptionStepManager(
        alcoholConsumptionRef.current,
        inProgressAuditScoreRef.current!
      );

      navigate(
        stepManagerRef.current.getNextStepUrl(
          RoutePath.AlcoholConsumptionJourney,
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
  const alcoholConsumptionRef = useRef<IAlcoholConsumption>();
  const inProgressAuditScoreRef = useRef<number>();

  async function updateHealthCheckAnswers(
    value: IAlcoholConsumption
  ): Promise<void> {
    const newData = {
      ...value,
      isAlcoholSectionSubmitted: false
    };
    await updateHealthCheck.mutateAsync({ answers: newData });
  }

  async function submitHealthCheckAnswers(): Promise<void> {
    await submitHealthCheck.mutateAsync({
      answers: { isAlcoholSectionSubmitted: true }
    });

    if (inProgressAuditScoreRef.current! >= 16) {
      void scheduleGpUpdateService.createGpUpdateSchedule(
        healthCheck.data?.id ?? '',
        GpUpdateReason.auditScore
      );
    }
  }

  if (healthCheck.isPending) {
    return <Spinner />;
  }

  if (healthCheck.isSuccess) {
    alcoholConsumptionRef.current = mapToAlcoholConsumption(
      healthCheck.data as IHealthCheck
    );
    inProgressAuditScoreRef.current =
      healthCheck.data!.questionnaireScores?.inProgressAuditScore ?? undefined;
    stepManagerRef.current = createAlcoholConsumptionStepManager(
      alcoholConsumptionRef.current,
      inProgressAuditScoreRef.current!
    );
  }

  if (healthCheck.isError) {
    return <Redirecting />;
  }

  switch (currentStep) {
    case JourneyStepNames.AlcoholQuestionPage:
      return renderStep(
        <AlcoholQuestionPage
          healthCheckAnswers={
            alcoholConsumptionRef.current as IAlcoholConsumption
          }
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.AlcoholOftenPage:
      return renderStep(
        <AlcoholOftenPage
          healthCheckAnswers={
            alcoholConsumptionRef.current as IAlcoholConsumption
          }
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.AlcoholTypicalUnitsPage:
      return renderStep(
        <AlcoholTypicalUnitsPage
          healthCheckAnswers={
            alcoholConsumptionRef.current as IAlcoholConsumption
          }
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

    case JourneyStepNames.AlcoholOccasionUnitsPage:
      return renderStep(
        <AlcoholOccasionUnitsPage
          healthCheckAnswers={
            alcoholConsumptionRef.current as IAlcoholConsumption
          }
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

    case JourneyStepNames.AlcoholStopPage:
      return renderStep(
        <AlcoholStopPage
          healthCheckAnswers={
            alcoholConsumptionRef.current as IAlcoholConsumption
          }
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

    case JourneyStepNames.AlcoholFailPage:
      return renderStep(
        <AlcoholFailPage
          healthCheckAnswers={
            alcoholConsumptionRef.current as IAlcoholConsumption
          }
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

    case JourneyStepNames.AlcoholMorningDrinkPage:
      return renderStep(
        <AlcoholMorningDrinkPage
          healthCheckAnswers={
            alcoholConsumptionRef.current as IAlcoholConsumption
          }
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

    case JourneyStepNames.AlcoholGuiltPage:
      return renderStep(
        <AlcoholGuiltPage
          healthCheckAnswers={
            alcoholConsumptionRef.current as IAlcoholConsumption
          }
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

    case JourneyStepNames.AlcoholMemoryLossPage:
      return renderStep(
        <AlcoholMemoryLossPage
          healthCheckAnswers={
            alcoholConsumptionRef.current as IAlcoholConsumption
          }
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

    case JourneyStepNames.AlcoholPersonInjuredPage:
      return renderStep(
        <AlcoholPersonInjuredPage
          healthCheckAnswers={
            alcoholConsumptionRef.current as IAlcoholConsumption
          }
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

    case JourneyStepNames.AlcoholConcernedRelativePage:
      return renderStep(
        <AlcoholConcernedRelativePage
          healthCheckAnswers={
            alcoholConsumptionRef.current as IAlcoholConsumption
          }
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

    case JourneyStepNames.CheckYourAnswersAlcoholPage:
      return renderStep(
        <CheckYourAnswersPage
          healthCheckAnswers={
            alcoholConsumptionRef.current as IAlcoholConsumption
          }
          submitAnswers={submitHealthCheckAnswers}
          healthCheck={healthCheck.data}
          patientId={healthCheck.data?.patientId ?? ''}
          auditScore={inProgressAuditScoreRef.current!}
        />
      );
    default:
      throw new Error(`Step not defined: ${currentStep}`);
  }

  function renderStep(stepComponent: JSX.Element) {
    const backToUrl =
      currentStep === JourneyStepNames.AlcoholQuestionPage
        ? RoutePath.TaskListPage
        : stepManagerRef.current!.getPreviousStepUrl(
            RoutePath.AlcoholConsumptionJourney,
            currentStep
          );

    return <PageLayout backToUrl={backToUrl}>{stepComponent}</PageLayout>;
  }
}
