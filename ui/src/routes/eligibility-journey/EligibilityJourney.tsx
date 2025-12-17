import { useRef, useEffect } from 'react';
import {
  create as createEligibilityStepManager,
  generateEligibilitySectionFirstStep
} from './EligibilityStepManager';
import type { IEligibility, IHealthCheck } from '@dnhc-health-checks/shared';
import SorryCannotGetHealthCheckWithPreexistingConditionPage from './steps/SorryCannotGetHealthCheckWithPreexistingConditionPage';
import PreexistingHealthConditionsPage from './steps/PreexistingHealthConditionsPage';
import PreviousHealthCheckCompletedQueryPage from './steps/PreviousHealthcheckCompletedQueryPage';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import { convertToNullableBool } from '../../lib/converters/boolean-converter';
import { usePageTitleContext } from '../../lib/contexts/PageTitleContext';
import {
  useHealthCheck,
  useHealthCheckMutation
} from '../../hooks/healthCheckHooks';
import type { StepManager } from '../StepManager';
import SorryCannotGetHealthCheckWithPreviousHealthCheckCompleted from './steps/SorryCannotGetHealthCheckWithPreviousHeathcheckCompleted';
import PageLayout from '../../layouts/PageLayout';
import { Redirecting } from '../../lib/pages/redirecting';
import { JourneyStepNames, RoutePath } from '../../lib/models/route-paths';
import WhoShouldNotUseOnlineServicePage from './steps/WhoShouldNotUseOnlineServicePage';
import ExtendedExclusionsShutterPage from './steps/ExtendedExclusionsShutterPage';
import { Spinner } from '../../lib/pages/spinner';
import ReceivedInvitationQueryPage from './steps/ReceivedInvitationQueryPage';

export default function EligibilityJourney() {
  const navigate = useNavigate();
  const healthCheck = useHealthCheck();

  const healthCheckData = healthCheck.data!;
  const updateHealthCheck = useHealthCheckMutation();
  const [searchParams] = useSearchParams();

  let currentStep = searchParams.get('step') ?? null;
  const { setCurrentStep } = usePageTitleContext();

  useEffect(() => {
    if (updateHealthCheck.isSuccess) {
      updateHealthCheck.reset();

      eligibilityRef.current = mapToEligibility(
        healthCheck.data as IHealthCheck
      );
      stepManagerRef.current = createEligibilityStepManager(
        eligibilityRef.current,
        healthCheckData.wasInvited
      );

      if (
        currentStep === JourneyStepNames.WhoShouldNotUseOnlineServicePage &&
        eligibilityRef.current.canCompleteHealthCheckOnline === true
      ) {
        navigate(RoutePath.TaskListPage);
      } else {
        navigate(
          stepManagerRef.current.getNextStepUrl(
            RoutePath.EligibilityJourney,
            currentStep
          )
        );
      }
    }
    setCurrentStep(currentStep ?? undefined);
    return () => {
      setCurrentStep(undefined);
    };
  }, [
    updateHealthCheck,
    healthCheck.data,
    currentStep,
    navigate,
    setCurrentStep
  ]);

  const stepManagerRef = useRef<StepManager>();
  const eligibilityRef = useRef<IEligibility>();

  async function updateHealthCheckAnswers(value: Partial<IEligibility>) {
    await updateHealthCheck.mutateAsync({ answers: value });
  }

  if (healthCheck.isPending) {
    return <Spinner />;
  }

  if (healthCheck.isSuccess) {
    eligibilityRef.current = mapToEligibility(healthCheckData);
    stepManagerRef.current = createEligibilityStepManager(
      eligibilityRef.current,
      healthCheckData.wasInvited
    );
    currentStep ??= stepManagerRef.current.getCurrentProgress(
      RoutePath.EligibilityJourney
    ).nextActionName;
  }

  if (healthCheck.isError) {
    return <Redirecting />;
  }

  switch (currentStep) {
    case JourneyStepNames.ReceivedInvitationQueryPage:
      return renderStepWithButtonBackToPreviousPage(
        <ReceivedInvitationQueryPage
          healthCheckAnswers={eligibilityRef.current as IEligibility}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    case JourneyStepNames.PreviousHealthCheckCompletedQueryPage:
      return renderStepWithButtonBackToPreviousPage(
        <PreviousHealthCheckCompletedQueryPage
          healthCheckAnswers={eligibilityRef.current as IEligibility}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    case JourneyStepNames.PreexistingHealthConditionsPage:
      return renderStepWithButtonBackToPreviousPage(
        <PreexistingHealthConditionsPage
          healthCheckAnswers={eligibilityRef.current as IEligibility}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    case JourneyStepNames.WhoShouldNotUseOnlineServicePage:
      return renderStepWithButtonBackToPreviousPage(
        <WhoShouldNotUseOnlineServicePage
          healthCheckAnswers={eligibilityRef.current as IEligibility}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    case JourneyStepNames.SorryCannotGetHealthCheckWithPreexistingConditionPage:
      return renderStepWithButtonBackToPreviousPage(
        <SorryCannotGetHealthCheckWithPreexistingConditionPage
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    case JourneyStepNames.SorryCannotGetHealthCheckWithPreviousHealthcheckCompleted:
      return renderStepWithButtonBackToNhsApp(
        <SorryCannotGetHealthCheckWithPreviousHealthCheckCompleted
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    case JourneyStepNames.ExtendedExclusionsShutterPage:
      return renderStepWithButtonBackToPreviousPage(
        <ExtendedExclusionsShutterPage
          healthCheck={healthCheck?.data}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    default:
      throw new Error(`Page not defined: ${currentStep}`);
  }

  function renderStep(
    stepComponent: JSX.Element,
    backToNhsAppServices: boolean
  ) {
    const backToUrl =
      currentStep ===
      generateEligibilitySectionFirstStep(healthCheckData.wasInvited)
        ? undefined
        : stepManagerRef.current?.getPreviousStepUrl(
            RoutePath.EligibilityJourney,
            currentStep
          );

    return (
      <PageLayout
        backToUrl={backToUrl}
        displayNhsAppServicesBackButton={backToNhsAppServices}
      >
        {stepComponent}
      </PageLayout>
    );
  }

  function renderStepWithButtonBackToNhsApp(stepComponent: JSX.Element) {
    return renderStep(stepComponent, true);
  }

  function renderStepWithButtonBackToPreviousPage(stepComponent: JSX.Element) {
    return renderStep(stepComponent, false);
  }
}

function mapToEligibility(healthCheck: IHealthCheck) {
  return {
    hasReceivedAnInvitation: convertToNullableBool(
      healthCheck.questionnaire?.hasReceivedAnInvitation
    ),
    hasPreExistingCondition: convertToNullableBool(
      healthCheck.questionnaire?.hasPreExistingCondition
    ),
    hasCompletedHealthCheckInLast5Years: convertToNullableBool(
      healthCheck.questionnaire?.hasCompletedHealthCheckInLast5Years
    ),
    canCompleteHealthCheckOnline: convertToNullableBool(
      healthCheck.questionnaire?.canCompleteHealthCheckOnline
    )
  };
}
