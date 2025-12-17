import { Card, Details, InsetText } from 'nhsuk-react-components';
import PageLayout from '../../layouts/PageLayout';
import { RoutePath } from '../../lib/models/route-paths';
import { Redirecting } from '../../lib/pages/redirecting';
import { useHealthCheck } from '../../hooks/healthCheckHooks';
import {
  AuditCategory,
  AuditEventType,
  PatientResultsDetailedOpenedPage
} from '@dnhc-health-checks/shared';
import { useAuditEvent } from '../../hooks/eventAuditHook';
import { useEffect } from 'react';
import {
  AlcoholDependencyDetails,
  AlcoholHighRiskDetails,
  AlcoholIncreasingRiskDetails,
  AlcoholLowRiskDetails,
  type AlcoholPageDetails
} from './AlcoholResultsPageRiskDetails';
import { Spinner } from '../../lib/pages/spinner';
import { EnumDescriptions } from '../../lib/models/enum-descriptions';

export default function AlcoholResultsPage() {
  const { triggerAuditEvent } = useAuditEvent();
  const healthCheck = useHealthCheck();

  useEffect(() => {
    void triggerAuditEvent({
      eventType: AuditEventType.PatientResultsDetailedOpened,
      healthCheck: healthCheck.data,
      details: { page: PatientResultsDetailedOpenedPage.Alcohol }
    });
  }, [healthCheck.data, triggerAuditEvent]);

  if (healthCheck.isPending) {
    return <Spinner />;
  }
  if (healthCheck.isError) {
    return <Redirecting />;
  }

  const auditCategory: AuditCategory =
    healthCheck.data?.questionnaireScores?.auditCategory ??
    AuditCategory.HighRisk;
  const auditScore: number =
    healthCheck.data?.questionnaireScores?.auditScore ?? 0;

  const alcoholDetails: AlcoholPageDetails = (() => {
    switch (auditCategory) {
      case AuditCategory.NoRisk:
      case AuditCategory.LowRisk:
        return new AlcoholLowRiskDetails(auditScore, healthCheck.data);
      case AuditCategory.IncreasingRisk:
        return new AlcoholIncreasingRiskDetails(auditScore, healthCheck.data);
      case AuditCategory.PossibleDependency:
        return new AlcoholDependencyDetails(auditScore, healthCheck.data);
      default:
        return new AlcoholHighRiskDetails(auditScore, healthCheck.data);
    }
  })();

  return (
    <PageLayout backToUrl={RoutePath.MainResultsPage}>
      <h1 className="nhsuk-heading-xl nhsuk-u-margin-bottom-5">
        Alcohol risk results
      </h1>
      <Card>
        <Card.Content>
          <div>
            <Card.Heading
              id="risk-level-heading"
              aria-labelledby="risk-level-heading screen-reader-text-separator risk-level"
            >
              Your alcohol risk level is
            </Card.Heading>
            {renderRiskLevelInsetText(alcoholDetails)}
          </div>
          {alcoholDetails.getRiskDescription()}
          {renderScoreDetails()}
        </Card.Content>
      </Card>

      {alcoholDetails.getMiddleSection()}
      {alcoholDetails.getBenefitsSection()}
      {alcoholDetails.getImportantNote()}
    </PageLayout>
  );
}

function renderScoreDetails() {
  return (
    <Details>
      <Details.Summary>What your score means</Details.Summary>
      <Details.Text>
        Based on your answers, you get a score out of 40. This shows your risk
        of alcohol-related health problems.
        <ul className="nhsuk-u-margin-top-4">
          <li>0 to 7 is low risk</li>
          <li>8 to 15 is increasing risk</li>
          <li>16 to 19 is high risk</li>
          <li>20 or more is possible dependency</li>
        </ul>
      </Details.Text>
    </Details>
  );
}

function renderRiskLevelInsetText(details: AlcoholPageDetails) {
  return (
    <InsetText
      aria-hidden="true"
      className={
        details.riskLevelColor + ' nhsuk-u-margin-top-5 nhsuk-u-margin-bottom-5'
      }
    >
      <p id="risk-level">
        {formatRiskLevel(
          EnumDescriptions.AuditCategory[details.displayRiskLevel]
        )}
      </p>
    </InsetText>
  );
}

function formatRiskLevel(riskLevel: string): string {
  return riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1).toLowerCase();
}
