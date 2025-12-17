import PageLayout from '../../layouts/PageLayout';
import { RoutePath } from '../../lib/models/route-paths';
import { Redirecting } from '../../lib/pages/redirecting';
import { useHealthCheck } from '../../hooks/healthCheckHooks';
import {
  BmiClassification,
  AuditEventType,
  PatientResultsDetailedOpenedPage
} from '@dnhc-health-checks/shared';
import { UnderweightDetails } from './bmi/UnderweightDetails';
import { HealthyDetails } from './bmi/HealthyDetails';
import {
  OverweightUnderSixtyFive,
  OverweightSixtyFiveOrOver
} from './bmi/Overweight';

import { ObeseUnderSixtyFive, ObeseSixtyFiveOrOver } from './bmi/Obese';
import { type BMICategoryDetailsPage } from './bmi/BMICategoryDetailsPage';
import { useAuditEvent } from '../../hooks/eventAuditHook';
import { useEffect } from 'react';
import { Spinner } from '../../lib/pages/spinner';

export default function BMIResultsPage() {
  const { triggerAuditEvent } = useAuditEvent();
  const healthCheck = useHealthCheck();

  useEffect(() => {
    void triggerAuditEvent({
      eventType: AuditEventType.PatientResultsDetailedOpened,
      healthCheck: healthCheck.data,
      details: { page: PatientResultsDetailedOpenedPage.BMI }
    });
  }, [healthCheck.data, triggerAuditEvent]);

  if (healthCheck.isPending) {
    return <Spinner />;
  }
  if (healthCheck.isError) {
    return <Redirecting />;
  }

  const bmiClassification =
    healthCheck.data!.questionnaireScores?.bmiClassification;

  const bmi: number = healthCheck.data!.questionnaireScores?.bmiScore ?? 0;
  const ethnicity = healthCheck.data!.questionnaire.ethnicBackground!;

  const ageAtCompletion = healthCheck.data!.ageAtCompletion!;

  const bmiDetails: BMICategoryDetailsPage = (() => {
    switch (bmiClassification) {
      case BmiClassification.Underweight:
        return new UnderweightDetails(healthCheck.data);
      case BmiClassification.Healthy:
        return new HealthyDetails(healthCheck.data);
      case BmiClassification.Overweight:
        return ageAtCompletion >= 65
          ? new OverweightSixtyFiveOrOver(healthCheck.data)
          : new OverweightUnderSixtyFive(healthCheck.data);
      case BmiClassification.Obese1:
      case BmiClassification.Obese2:
      case BmiClassification.Obese3:
        return ageAtCompletion >= 65
          ? new ObeseSixtyFiveOrOver(healthCheck.data)
          : new ObeseUnderSixtyFive(healthCheck.data);
      default:
        throw new Error(`Unhandled bmi classification: ${bmiClassification}`);
    }
  })();

  return (
    <PageLayout backToUrl={RoutePath.MainResultsPage}>
      <h1 className="nhsuk-heading-xl nhsuk-u-margin-bottom-5">
        Body mass index (BMI) results
      </h1>
      {bmiDetails.getPageContent(bmi, ethnicity)}
    </PageLayout>
  );
}
