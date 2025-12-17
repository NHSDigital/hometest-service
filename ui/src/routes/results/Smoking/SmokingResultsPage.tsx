import { Redirecting } from '../../../lib/pages/redirecting';
import { useHealthCheck } from '../../../hooks/healthCheckHooks';
import { type SmokingPageDetails } from './SmokingBase';
import { SmokingNeverSmokedDetails } from './SmokingNeverSmokedDetails';
import { Card, InsetText } from 'nhsuk-react-components';
import { RoutePath } from '../../../lib/models/route-paths';
import PageLayout from '../../../layouts/PageLayout';
import {
  SmokingCategory,
  AuditEventType,
  PatientResultsDetailedOpenedPage,
  type Smoking
} from '@dnhc-health-checks/shared';
import { SmokingExSmokerDetails } from './SmokingExSmokerDetails';
import { SmokingCurrentSmokerDetails } from './SmokingCurrentSmokerDetails';
import { useEffect } from 'react';
import { useAuditEvent } from '../../../hooks/eventAuditHook';
import { Spinner } from '../../../lib/pages/spinner';

export default function SmokingResultsPage() {
  const { triggerAuditEvent } = useAuditEvent();

  const healthCheck = useHealthCheck();

  useEffect(() => {
    void triggerAuditEvent({
      eventType: AuditEventType.PatientResultsDetailedOpened,
      healthCheck: healthCheck.data,
      details: { page: PatientResultsDetailedOpenedPage.Smoking }
    });
  }, [healthCheck.data, triggerAuditEvent]);

  if (healthCheck.isPending) {
    return <Spinner />;
  }
  if (healthCheck.isError) {
    return <Redirecting />;
  }

  const smokingCategory = healthCheck.data!.questionnaireScores
    ?.smokingCategory as SmokingCategory;

  const smokingDetails = (() => {
    switch (smokingCategory) {
      case SmokingCategory.CurrentSmoker:
        return new SmokingCurrentSmokerDetails(
          healthCheck.data!.questionnaire.smoking as Smoking,
          healthCheck.data
        );
      case SmokingCategory.ExSmoker:
        return new SmokingExSmokerDetails(healthCheck.data);
      case SmokingCategory.NeverSmoked:
        return new SmokingNeverSmokedDetails(healthCheck.data);
      default:
        throw new Error(
          `Unhandled smoking classification: ${String(smokingCategory)}`
        );
    }
  })();

  return (
    <PageLayout backToUrl={RoutePath.MainResultsPage}>
      <h1 className="nhsuk-heading-xl nhsuk-u-margin-bottom-5">
        Smoking results
      </h1>
      <Card>
        <Card.Content>
          <Card.Heading>{smokingDetails.headingMessage()}</Card.Heading>
          {renderRiskLevelInsetText(smokingDetails)}
        </Card.Content>
      </Card>
      {smokingDetails.getPageContent()}
    </PageLayout>
  );
}

function renderRiskLevelInsetText(details: SmokingPageDetails) {
  return (
    <InsetText className={details.SmokingResultColor + ' nhsuk-u-margin-top-5'}>
      {details.getRiskDescription()}
    </InsetText>
  );
}
