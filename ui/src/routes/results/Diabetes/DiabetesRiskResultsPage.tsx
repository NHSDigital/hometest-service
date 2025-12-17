import { Card, Details } from 'nhsuk-react-components';
import PageLayout from '../../../layouts/PageLayout';
import { RoutePath } from '../../../lib/models/route-paths';
import {
  DiabetesAtRiskDetails,
  DiabetesHighRiskDetails,
  DiabetesLowLeicesterRiskDetails,
  DiabetesLowRiskDetails,
  type DiabetesPageDetails,
  getExternalDiabetesResource
} from './DiabetesResultsPageRiskDetails';
import { useAuditEvent } from '../../../hooks/eventAuditHook';
import { useEffect } from 'react';
import {
  AuditEventType,
  PatientResultsDetailedOpenedPage,
  OverallDiabetesCategory,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { useHealthCheck } from '../../../hooks/healthCheckHooks';
import { Spinner } from '../../../lib/pages/spinner';
import { Redirecting } from '../../../lib/pages/redirecting';
import { getLatestBiometricScores } from '../../../services/biometrics-score-service';

export default function DiabetesRiskResultsPage() {
  const { triggerAuditEvent } = useAuditEvent();
  const healthCheck = useHealthCheck();

  useEffect(() => {
    void triggerAuditEvent({
      eventType: AuditEventType.PatientResultsDetailedOpened,
      healthCheck: healthCheck.data,
      details: { page: PatientResultsDetailedOpenedPage.Diabetes }
    });
  }, [healthCheck.data, triggerAuditEvent]);

  if (healthCheck.isPending) {
    return <Spinner />;
  }
  if (healthCheck.isError) {
    return <Redirecting />;
  }

  const biometricScores = getLatestBiometricScores(healthCheck.data);
  const diabetesCategory = biometricScores.diabetes?.overallCategory;
  const diabetesScore = biometricScores.diabetes?.hba1c;
  const diabetesDetails: DiabetesPageDetails = (() => {
    const safeDiabetesScore =
      typeof diabetesScore === 'number' ? diabetesScore : 0;
    switch (diabetesCategory) {
      case OverallDiabetesCategory.Low:
        return new DiabetesLowRiskDetails(safeDiabetesScore, healthCheck.data);
      case OverallDiabetesCategory.AtRisk:
        return new DiabetesAtRiskDetails(safeDiabetesScore, healthCheck.data);
      case OverallDiabetesCategory.High:
        return new DiabetesHighRiskDetails(safeDiabetesScore, healthCheck.data);
      default:
        return new DiabetesLowLeicesterRiskDetails();
    }
  })();
  return (
    <PageLayout backToUrl={RoutePath.MainResultsPage}>
      <h1 className="nhsuk-heading-xl nhsuk-u-margin-bottom-5">
        Diabetes results
      </h1>
      <Card>
        <Card.Content>
          <Card.Heading headingLevel="h2">
            {diabetesCategory === OverallDiabetesCategory.High
              ? 'Your result is:'
              : 'Your risk of type 2 diabetes is:'}

            <span className="nhsuk-heading-l nhsuk-u-margin-top-3">
              {diabetesDetails.displayRiskLevel}
            </span>
          </Card.Heading>
          {diabetesDetails.getRiskDescription()}
          {diabetesCategory !== OverallDiabetesCategory.LowRiskNoBloodTest &&
            renderScoreDetails(healthCheck.data)}
        </Card.Content>
      </Card>
      {diabetesDetails.getAdviceSection()}
      {diabetesDetails.getGPSection()}
      {diabetesDetails.getUseFulResources()}
    </PageLayout>
  );
}

function renderScoreDetails(healthCheck?: IHealthCheck) {
  return (
    <Details>
      <Details.Summary>What your HbA1c blood test means</Details.Summary>
      <Details.Text>
        <p>
          Your HbA1c blood test shows your average blood sugar (glucose) level
          for the last 2 to 3 months.
        </p>
        <ul className="nhsuk-u-margin-top-4">
          <li>
            41 mmol/mol or lower is in the normal range for a person without
            diabetes. You can still be at moderate risk of type 2 diabetes based
            on height, weight or family history
          </li>
          <li>
            42 to 47 mmol/mol suggests that you are at high risk of developing
            type 2 diabetes - this is known as prediabetes
          </li>
          <li>48 mmol/mol or higher suggests possible type 2 diabetes</li>
        </ul>
        <p>
          {getExternalDiabetesResource(
            'https://www.diabetes.org.uk/diabetes-the-basics/test-for-diabetes',
            'Getting tested for diabetes - Diabetes UK',
            healthCheck
          )}
        </p>
        <p>
          {getExternalDiabetesResource(
            'https://www.diabetes.org.uk/about-diabetes/looking-after-diabetes/hba1c',
            'What is HbA1c? - Diabetes UK',
            healthCheck
          )}
        </p>
      </Details.Text>
    </Details>
  );
}
