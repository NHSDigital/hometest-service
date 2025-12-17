import { Redirecting } from '../../lib/pages/redirecting';
import { useHealthCheck } from '../../hooks/healthCheckHooks';
import { Card, InsetText } from 'nhsuk-react-components';
import { RoutePath } from '../../lib/models/route-paths';
import PageLayout from '../../layouts/PageLayout';
import {
  BloodPressureCategory,
  type BloodPressureLocation,
  AuditEventType,
  PatientResultsDetailedOpenedPage
} from '@dnhc-health-checks/shared';
import { useEffect } from 'react';
import { useAuditEvent } from '../../hooks/eventAuditHook';
import { BloodPressureGraph } from '../../lib/components/blood-pressure-graph/blood-pressure-graph';
import { Spinner } from '../../lib/pages/spinner';
import { type BloodPressurePageDetails } from './Blood-Pressure/BloodPressureBase';
import { BloodPressureHealthyDetails } from './Blood-Pressure/BloodPressureHealthyDetails';
import { BloodPressureHighDetails } from './Blood-Pressure/BloodPressureHighDetails';
import { BloodPressureLowNoFaintingDetails } from './Blood-Pressure/BloodPressureLowNoFaintingDetails';
import { BloodPressureSlightlyRaisedDetails } from './Blood-Pressure/BloodPressureSlightlyRaisedDetails';

export default function BloodPressureResultsPage() {
  const healthCheck = useHealthCheck();
  const { triggerAuditEvent } = useAuditEvent();

  useEffect(() => {
    void triggerAuditEvent({
      eventType: AuditEventType.PatientResultsDetailedOpened,
      healthCheck: healthCheck.data,
      details: { page: PatientResultsDetailedOpenedPage.BloodPressure }
    });
  }, [healthCheck.data, triggerAuditEvent]);

  if (healthCheck.isPending) {
    return <Spinner />;
  }
  if (healthCheck.isError) {
    return <Redirecting />;
  }

  const systolic = healthCheck.data!.questionnaire.bloodPressureSystolic!;
  const diastolic = healthCheck.data!.questionnaire.bloodPressureDiastolic!;

  const bloodPressureCategory =
    healthCheck.data!.questionnaireScores?.bloodPressureCategory;
  const bloodPressureLocation = healthCheck.data!.questionnaire
    .bloodPressureLocation as BloodPressureLocation;

  const bloodPressureDetails = (() => {
    switch (bloodPressureCategory) {
      case BloodPressureCategory.Healthy:
        return new BloodPressureHealthyDetails(
          bloodPressureLocation,
          healthCheck.data
        );
      case BloodPressureCategory.Low:
        return new BloodPressureLowNoFaintingDetails(
          bloodPressureLocation,
          healthCheck.data
        );
      case BloodPressureCategory.SlightlyRaised:
        return new BloodPressureSlightlyRaisedDetails(
          bloodPressureLocation,
          healthCheck.data
        );
      case BloodPressureCategory.High:
        return new BloodPressureHighDetails(
          bloodPressureLocation,
          healthCheck.data
        );
      default:
        throw new Error(`Unhandled Blood Pressure category: Unknown`);
    }
  })();

  return (
    <PageLayout backToUrl={RoutePath.MainResultsPage}>
      <h1 className="nhsuk-heading-xl nhsuk-u-margin-bottom-5">
        Blood pressure results
      </h1>
      <Card>
        <Card.Content>
          <Card.Heading
            headingLevel="h2"
            className="nhsuk-u-font-size-24"
            aria-label={`Your blood pressure is: ${healthCheck.data!.questionnaire.bloodPressureSystolic}/${healthCheck.data!.questionnaire.bloodPressureDiastolic}`}
          >
            Your blood pressure is:{''}
            <span
              aria-hidden="true"
              className="nhsuk-heading-l nhsuk-u-margin-top-3"
            >{`${healthCheck.data!.questionnaire.bloodPressureSystolic}/${healthCheck.data!.questionnaire.bloodPressureDiastolic}`}</span>
          </Card.Heading>
          {renderRiskLevelInsetText(bloodPressureDetails)}
          <BloodPressureGraph
            systolic={systolic}
            diastolic={diastolic}
            bloodPressureCategory={bloodPressureCategory}
            location={bloodPressureLocation}
          />
        </Card.Content>
      </Card>
      {bloodPressureDetails.getPageContent()}
    </PageLayout>
  );
}

function renderRiskLevelInsetText(details: BloodPressurePageDetails) {
  return (
    <InsetText
      className={details.BloodPressureResultColor + ' nhsuk-u-margin-top-5'}
    >
      {details.getRiskDescription()}
    </InsetText>
  );
}
