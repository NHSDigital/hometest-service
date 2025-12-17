import { create as createAboutYouStepManager } from './AboutYouStepManager';
import EthnicGroupPage from './steps/EthnicGroupPage';
import ParentSiblingHeartAttackPage from './steps/ParentSiblingHeartAttackPage';
import ParentSiblingChildDiabetesPage from './steps/ParentSiblingChildDiabetesPage';
import SexAssignedAtBirthPage from './steps/SexAssignedAtBirthPage';
import SmokingQuestionPage from './steps/SmokingQuestionPage';
import { useNavigate } from 'react-router';
import {
  type EthnicBackground,
  type IAboutYou,
  type ParentSiblingHeartAttack,
  type ParentSiblingChildDiabetes,
  type Sex,
  type Smoking,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { useEffect, useRef } from 'react';
import CheckYourAnswersPage from './steps/CheckYourAnswersPage';
import { useSearchParams } from 'react-router-dom';
import { DescribeEthnicBackgroundPage } from './steps/DescribeEthnicBackgroundPage';
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
import TownsendPostcodePage from './steps/TownsendPostcodePage';
import { Spinner } from '../../lib/pages/spinner';
import LupusPage from './steps/LupusPage';
import SevereMentalIllnessPage from './steps/SevereMentalIllness';
import AntipsychoticMedicationPage from './steps/AntipsychoticMedicationPage';
import MigrainesPage from './steps/MigrainesPage';
import ErectileDysfunctionPage from './steps/ErectileDysfunctionPage';
import SteroidPage from './steps/SteroidPage';
import RheumatoidArthritisPage from './steps/RheumatoidArthritisPage';

export default function AboutYouJourney() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams({
    step: JourneyStepNames.TownsendPostcodePage
  });
  const healthCheck = useHealthCheck();
  const updateHealthCheck = useHealthCheckMutation();
  const submitHealthCheck = useHealthCheckMutation();
  const currentStep = searchParams.get('step');
  const { setCurrentStep } = usePageTitleContext();

  useEffect(() => {
    if (updateHealthCheck.isSuccess) {
      updateHealthCheck.reset();

      aboutYouRef.current = mapToAboutYou(healthCheck.data!);
      stepManagerRef.current = createAboutYouStepManager(aboutYouRef.current);

      navigate(
        stepManagerRef.current.getNextStepUrl(
          RoutePath.AboutYouJourney,
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
    searchParams,
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
  const aboutYouRef = useRef<IAboutYou>();

  async function updateHealthCheckAnswers(
    value: Partial<IAboutYou>
  ): Promise<void> {
    const newData: Partial<IAboutYou> = {
      ...value,
      isAboutYouSectionSubmitted: false
    };
    await updateHealthCheck.mutateAsync({ answers: newData });
  }

  async function submitHealthCheckAnswers(): Promise<void> {
    await submitHealthCheck.mutateAsync({
      answers: { isAboutYouSectionSubmitted: true }
    });
  }

  if (healthCheck.isPending) {
    return <Spinner />;
  }

  if (healthCheck.isSuccess) {
    aboutYouRef.current = mapToAboutYou(healthCheck.data!);
    stepManagerRef.current = createAboutYouStepManager(aboutYouRef.current);
  }

  if (healthCheck.isError) {
    return <Redirecting />;
  }

  switch (currentStep) {
    case JourneyStepNames.TownsendPostcodePage:
      return renderStep(
        <TownsendPostcodePage
          healthCheckAnswers={aboutYouRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.ParentSiblingHeartAttackPage:
      return renderStep(
        <ParentSiblingHeartAttackPage
          healthCheckAnswers={aboutYouRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.ParentSiblingChildDiabetesPage:
      return renderStep(
        <ParentSiblingChildDiabetesPage
          healthCheckAnswers={aboutYouRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.SexAssignedAtBirthPage:
      return renderStep(
        <SexAssignedAtBirthPage
          healthCheckAnswers={aboutYouRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.EthnicGroupPage:
      return renderStep(
        <EthnicGroupPage
          healthCheckAnswers={aboutYouRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.DescribeEthnicBackgroundPage:
      return renderStep(
        <DescribeEthnicBackgroundPage
          healthCheckAnswers={aboutYouRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.SmokingQuestionPage:
      return renderStep(
        <SmokingQuestionPage
          healthCheckAnswers={aboutYouRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.LupusPage:
      return renderStep(
        <LupusPage
          healthCheckAnswers={aboutYouRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.SevereMentalIllness:
      return renderStep(
        <SevereMentalIllnessPage
          healthCheckAnswers={aboutYouRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.AtypicalAntipsychoticMedication:
      return renderStep(
        <AntipsychoticMedicationPage
          healthCheckAnswers={aboutYouRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.Migraines:
      return renderStep(
        <MigrainesPage
          healthCheckAnswers={aboutYouRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.ErectileDysfunction:
      return renderStep(
        <ErectileDysfunctionPage
          healthCheckAnswers={aboutYouRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.SteroidTablets:
      return renderStep(
        <SteroidPage
          healthCheckAnswers={aboutYouRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.RheumatoidArthritis:
      return renderStep(
        <RheumatoidArthritisPage
          healthCheckAnswers={aboutYouRef.current!}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
    case JourneyStepNames.CheckYourAnswersAboutYouPage:
      return renderStep(
        <CheckYourAnswersPage
          healthCheckAnswers={aboutYouRef.current!}
          submitAnswers={submitHealthCheckAnswers}
          healthCheck={healthCheck.data}
          patientId={healthCheck.data?.patientId ?? ''}
        />
      );
    default:
      throw new Error(`Page not defined: ${currentStep}`);
  }

  function renderStep(stepComponent: JSX.Element) {
    const backToUrl =
      currentStep === JourneyStepNames.TownsendPostcodePage
        ? RoutePath.TaskListPage
        : stepManagerRef.current!.getPreviousStepUrl(
            RoutePath.AboutYouJourney,
            currentStep
          );

    return <PageLayout backToUrl={backToUrl}>{stepComponent}</PageLayout>;
  }
}

function mapToAboutYou(healthCheck: IHealthCheck): IAboutYou {
  return {
    postcode: healthCheck.questionnaire?.postcode,
    hasFamilyHeartAttackHistory: mapToEnum<ParentSiblingHeartAttack>(
      healthCheck.questionnaire?.hasFamilyHeartAttackHistory
    ),
    hasFamilyDiabetesHistory: mapToEnum<ParentSiblingChildDiabetes>(
      healthCheck.questionnaire?.hasFamilyDiabetesHistory
    ),
    sex: mapToEnum<Sex>(healthCheck.questionnaire?.sex),
    ethnicBackground: mapToEnum<EthnicBackground>(
      healthCheck.questionnaire?.ethnicBackground
    ),
    detailedEthnicGroup: healthCheck.questionnaire?.detailedEthnicGroup ?? null,
    smoking: mapToEnum<Smoking>(healthCheck.questionnaire?.smoking),
    lupus: healthCheck.questionnaire?.lupus,
    severeMentalIllness: healthCheck.questionnaire?.severeMentalIllness,
    atypicalAntipsychoticMedication:
      healthCheck.questionnaire?.atypicalAntipsychoticMedication,
    migraines: healthCheck.questionnaire?.migraines,
    impotence: healthCheck.questionnaire?.impotence,
    steroidTablets: healthCheck.questionnaire?.steroidTablets,
    rheumatoidArthritis: healthCheck.questionnaire?.rheumatoidArthritis,
    isAboutYouSectionSubmitted:
      healthCheck.questionnaire?.isAboutYouSectionSubmitted
  };
}
