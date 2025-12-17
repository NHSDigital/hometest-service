import { SummaryList } from 'nhsuk-react-components';
import {
  useHealthCheck,
  useHealthCheckSubmitMutation
} from '../../hooks/healthCheckHooks';
import AboutYouSummaryRows from '../about-you-journey/steps/about-you-summary-rows';
import AlcoholConsumptionSummaryRows from '../alcohol-consumption-journey/steps/alcohol-consumption-summary-rows';
import getPhysicalActivitySummaryRows from '../physical-activity-journey/steps/physical-activity-summary-rows';
import BloodPressureSummaryRows from '../blood-pressure-journey/steps/blood-pressure-summary-rows';
import BodyMeasurementsSummaryRows from '../body-measurements-journey/steps/BodyMeasurementsSummaryRows';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  AuditEventType,
  type IPhysicalActivity
} from '@dnhc-health-checks/shared';
import { EventAuditButton } from '../../lib/components/event-audit-button';
import PageLayout from '../../layouts/PageLayout';
import { Redirecting } from '../../lib/pages/redirecting';
import {
  getStepUrl,
  JourneyStepNames,
  RoutePath
} from '../../lib/models/route-paths';
import { ImportantCallout } from '../../lib/components/important-callout';
import { Spinner } from '../../lib/pages/spinner';
import { useAuditEvent } from '../../hooks/eventAuditHook';

export default function CheckAndSubmitYourAnswersPage() {
  const navigate = useNavigate();
  const healthCheck = useHealthCheck();
  const { triggerAuditEvent } = useAuditEvent();

  const healthCheckData = healthCheck.data!;
  const submitHealthCheck = useHealthCheckSubmitMutation();

  useEffect(() => {
    if (submitHealthCheck.isSuccess) {
      submitHealthCheck.reset();
      void triggerAuditEvent({
        eventType: AuditEventType.SectionStartBloodTest,
        healthCheck: healthCheck.data,
        patientId: healthCheck.data?.patientId
      });
      navigate(
        `${getStepUrl(
          RoutePath.BloodTestJourney,
          JourneyStepNames.BloodTestDeclarationPage
        )}&from=${RoutePath.CheckAndSubmitYourAnswersPage}`
      );
    }
  }, [navigate, submitHealthCheck]);

  async function submitHealthCheckAnswers(): Promise<void> {
    await submitHealthCheck.mutateAsync();
  }

  if (healthCheck.isPending) {
    return <Spinner />;
  }

  if (healthCheck.isError || submitHealthCheck.isError) {
    return <Redirecting />;
  }

  const { PhysicalActivitySummaryRows, PhysicalActivityOptionalSummaryRows } =
    getPhysicalActivitySummaryRows({
      physicalActivityAnswers:
        healthCheckData.questionnaire as IPhysicalActivity
    });

  return (
    <PageLayout backToUrl={RoutePath.TaskListPage}>
      <h1>Check your answers</h1>
      <ImportantCallout>
        <p>
          Check your answers before you submit them. After you submit them you
          cannot edit them again. This is so we can complete your health check.
        </p>
      </ImportantCallout>
      <h2>About you</h2>
      <SummaryList>
        <AboutYouSummaryRows aboutYouAnswers={healthCheckData.questionnaire} />
      </SummaryList>
      <h2>Physical activity</h2>
      <SummaryList>{PhysicalActivitySummaryRows}</SummaryList>
      <h3>Everyday movement</h3>
      <SummaryList>{PhysicalActivityOptionalSummaryRows}</SummaryList>
      <h2>Alcohol consumption</h2>
      <SummaryList>
        <AlcoholConsumptionSummaryRows
          alcoholConsumptionAnswers={healthCheckData.questionnaire}
          auditScore={healthCheckData.questionnaireScores?.auditScore as number}
        />
      </SummaryList>
      <h2>Body measurements</h2>
      <SummaryList>
        <BodyMeasurementsSummaryRows
          bodyMeasurementsAnswers={healthCheckData.questionnaire}
        />
      </SummaryList>
      <h2>Blood pressure</h2>
      <SummaryList>
        <BloodPressureSummaryRows
          bloodPressureAnswers={healthCheckData.questionnaire}
        />
      </SummaryList>
      <EventAuditButton
        onClick={submitHealthCheckAnswers}
        auditEvents={[
          {
            eventType: AuditEventType.SectionCompleteCheckAnswers,
            healthCheck: healthCheck.data,
            patientId: healthCheck.data?.patientId
          }
        ]}
      >
        Submit
      </EventAuditButton>
    </PageLayout>
  );
}
