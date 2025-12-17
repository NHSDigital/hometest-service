import {
  HealthCheckStatusCalculator,
  SectionStatus
} from '../statuses/statusCalculator';
import { AuditEventType, HealthCheckSteps } from '@dnhc-health-checks/shared';
import TaskList from '../lib/components/task-list/task-list';
import { useHealthCheck } from '../hooks/healthCheckHooks';
import PageLayout from '../layouts/PageLayout';
import { Redirecting } from '../lib/pages/redirecting';
import {
  getStepUrl,
  JourneyStepNames,
  RoutePath
} from '../lib/models/route-paths';
import { useAuditEvent } from '../hooks/eventAuditHook';
import { Spinner } from '../lib/pages/spinner';
import { Fragment } from 'react/jsx-runtime';
import {
  noLabResultAutoExpireAfterDays,
  testAutoExpireAfterDays
} from '../settings';
import { convertToFormattedExpiryDate } from '../lib/converters/expiry-date-converter';

const statusCalculator = new HealthCheckStatusCalculator();

export default function TaskListPage() {
  const healthCheck = useHealthCheck();

  const healthCheckData = healthCheck.data!;
  const { triggerAuditEvent } = useAuditEvent();

  function startSection(event: AuditEventType) {
    void triggerAuditEvent({
      eventType: event,
      healthCheck: healthCheckData,
      patientId: healthCheckData.patientId
    });
  }

  function generateTaskListSection(
    sectionTitle: string,
    sectionStatus: SectionStatus,
    sectionEvent: AuditEventType,
    sectionPath: string,
    sectionFirstStep?: string
  ) {
    const showSectionLink =
      healthCheck.data?.step === HealthCheckSteps.INIT &&
      (sectionStatus === SectionStatus.NotStarted ||
        sectionStatus === SectionStatus.Started ||
        sectionStatus === SectionStatus.Completed);

    const itemHref = showSectionLink
      ? getStepUrl(sectionPath, sectionFirstStep ?? null)
      : undefined;

    return (
      <TaskList.Item
        title={sectionTitle}
        itemHref={itemHref}
        status={sectionStatus}
        itemOnClick={
          showSectionLink ? () => startSection(sectionEvent) : undefined
        }
      />
    );
  }

  function generateOrderBloodTestSection(sectionStatus: SectionStatus) {
    const showSectionLink =
      sectionStatus === SectionStatus.NotStarted ||
      sectionStatus === SectionStatus.Started ||
      sectionStatus === SectionStatus.Completed;

    return (
      <TaskList.Item
        title="Order a blood test kit"
        itemHref={
          showSectionLink
            ? getStepUrl(
                RoutePath.BloodTestJourney,
                JourneyStepNames.BloodTestDeclarationPage
              )
            : undefined
        }
        status={sectionStatus}
        itemOnClick={
          showSectionLink
            ? () => startSection(AuditEventType.SectionStartBloodTest)
            : undefined
        }
      />
    );
  }

  function generateTimeLeftToCompleteHealthCheckParagraph(): JSX.Element | null {
    if (healthCheck.data?.step === HealthCheckSteps.INIT) {
      return generateQuestionnaireExpiryDate();
    } else if (isWaitingForBloodTestToBeOrderedOrReturned()) {
      return generateBloodTestExpiryDate();
    } else {
      return null;
    }
  }

  function isWaitingForBloodTestToBeOrderedOrReturned(): boolean {
    if (
      healthCheck.data?.step === HealthCheckSteps.QUESTIONNAIRE_COMPLETED ||
      healthCheck.data?.step === HealthCheckSteps.LAB_ORDERS_PLACED ||
      healthCheck.data?.step === HealthCheckSteps.LAB_ORDERS_SCHEDULED
    ) {
      return true;
    }
    return false;
  }

  function generateQuestionnaireExpiryDate(): JSX.Element {
    const formattedExpiry = convertToFormattedExpiryDate(
      healthCheckData.createdAt,
      testAutoExpireAfterDays
    );

    return (
      <p
        aria-label={`You have until ${formattedExpiry} to complete sections 1 to 4 and submit your answers.`}
      >
        {'You have until '}
        <span className="nhsuk-u-font-weight-bold">{formattedExpiry}</span>
        {' to complete sections 1 to 4 and submit your answers.'}
      </p>
    );
  }

  function generateBloodTestExpiryDate(): JSX.Element {
    const formattedExpiry = convertToFormattedExpiryDate(
      healthCheckData.questionnaireCompletionDate,
      noLabResultAutoExpireAfterDays
    );

    return (
      <Fragment>
        <p>
          {
            'Complete section 5 and order your blood test kit as soon as possible.'
          }
        </p>
        <p>
          {
            'Your NHS Health Check will expire if we do not have your results back from the lab by'
          }
          <span className="nhsuk-u-font-weight-bold">{` ${formattedExpiry}.`}</span>
        </p>
      </Fragment>
    );
  }

  if (healthCheck.isPending) {
    return <Spinner />;
  }

  if (healthCheck.isError) {
    return <Redirecting />;
  }

  const sections = statusCalculator.calculateStatus(healthCheckData);
  const sectionTotals = statusCalculator.getSectionTotals(sections);

  return (
    <PageLayout displayNhsAppServicesBackButton={true}>
      <h1 className="nhsuk-heading-xl">NHS Health Check</h1>

      <p>NHS Health Check incomplete</p>
      <p>
        {`You have completed ${sectionTotals.complete} of ${sectionTotals.total} sections`}
      </p>
      {generateTimeLeftToCompleteHealthCheckParagraph()}

      <h2 className="nhsuk-heading-m">1. Health questionnaire</h2>
      <TaskList>
        {generateTaskListSection(
          'About you',
          sections.aboutYou,
          AuditEventType.SectionStartAboutYou,
          RoutePath.AboutYouJourney,
          JourneyStepNames.TownsendPostcodePage
        )}
        {generateTaskListSection(
          'Physical activity',
          sections.physicalActivity,
          AuditEventType.SectionStartPhysicalActivity,
          RoutePath.PhysicalActivityJourney,
          JourneyStepNames.HoursExercisedPage
        )}
        {generateTaskListSection(
          'Alcohol consumption',
          sections.alcoholConsumption,
          AuditEventType.SectionStartAlcoholConsumption,
          RoutePath.AlcoholConsumptionJourney,
          JourneyStepNames.AlcoholQuestionPage
        )}
        {generateTaskListSection(
          'Enter body measurements',
          sections.bodyMeasurements,
          AuditEventType.SectionStartBodyMeasurements,
          RoutePath.BodyMeasurementsJourney,
          JourneyStepNames.HeightPage
        )}
      </TaskList>

      <h2 className="nhsuk-heading-m">2. Blood pressure</h2>
      <TaskList>
        {generateTaskListSection(
          'Check your blood pressure',
          sections.bloodPressure,
          AuditEventType.SectionStartBloodPressure,
          RoutePath.BloodPressureJourney,
          JourneyStepNames.BloodPressureCheckPage
        )}
      </TaskList>

      <h2 className="nhsuk-heading-m">3. Submit</h2>
      <TaskList>
        {generateTaskListSection(
          'Review and submit',
          sections.reviewAndSubmit,
          AuditEventType.SectionStartCheckAnswers,
          RoutePath.CheckAndSubmitYourAnswersPage
        )}
      </TaskList>

      <h2 className="nhsuk-heading-m">4. Blood test</h2>
      <TaskList>{generateOrderBloodTestSection(sections.bloodTest)}</TaskList>
    </PageLayout>
  );
}
