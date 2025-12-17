import PageLayout from '../../layouts/PageLayout';
import { RoutePath } from '../../lib/models/route-paths';
import { useEffect } from 'react';
import { useAuditEvent } from '../../hooks/eventAuditHook';
import {
  type Sex,
  AuditEventType,
  PatientResultsDetailedOpenedPage,
  OverallCholesterolCategory
} from '@dnhc-health-checks/shared';
import { CholesterolNormal } from './cholesterol/CholesterolNormal';
import { useHealthCheck } from '../../hooks/healthCheckHooks';
import { Redirecting } from '../../lib/pages/redirecting';
import { Spinner } from '../../lib/pages/spinner';
import {
  type CholesterolBase,
  type CholesterolParams
} from './cholesterol/CholesterolBase';
import { CholesterolHigh } from './cholesterol/CholesterolHigh';
import { CholesterolAtRisk } from './cholesterol/CholesterolAtRisk';
import { getLatestBiometricScores } from '../../services/biometrics-score-service';
import { CholesterolPartial } from './cholesterol/CholesterolPartial';

export default function CholesterolResultsPage() {
  const { triggerAuditEvent } = useAuditEvent();
  const healthCheck = useHealthCheck();

  useEffect(() => {
    void triggerAuditEvent({
      eventType: AuditEventType.PatientResultsDetailedOpened,
      healthCheck: healthCheck.data,
      details: { page: PatientResultsDetailedOpenedPage.Cholesterol }
    });
  }, [healthCheck.data, triggerAuditEvent]);

  if (healthCheck.isPending) {
    return <Spinner />;
  }
  if (healthCheck.isError) {
    return <Redirecting />;
  }

  const sex = healthCheck.data?.questionnaire.sex;

  const biometricScores = getLatestBiometricScores(healthCheck.data);
  const cholesterolScoresDB = biometricScores?.cholesterol;

  const cholesterolParams: CholesterolParams = {
    sex: sex as Sex,
    cholesterolScore: cholesterolScoresDB!
  };

  const overallCholesterolCategory = cholesterolScoresDB?.overallCategory;
  const cholesterolClassification: CholesterolBase = (() => {
    switch (overallCholesterolCategory) {
      case OverallCholesterolCategory.Normal:
        return new CholesterolNormal(cholesterolParams);
      case OverallCholesterolCategory.AtRisk:
        return new CholesterolAtRisk(cholesterolParams);
      case OverallCholesterolCategory.High:
      case OverallCholesterolCategory.VeryHigh:
        return new CholesterolHigh(cholesterolParams);
      case OverallCholesterolCategory.PartialFailure:
        return new CholesterolPartial(cholesterolParams, true);
      default:
        throw new Error(
          `Unhandled Cholesterol classification: ${overallCholesterolCategory}`
        );
    }
  })();

  return (
    <PageLayout backToUrl={RoutePath.MainResultsPage}>
      <h1 className="nhsuk-heading-xl nhsuk-u-margin-bottom-5">
        Cholesterol results
      </h1>
      {cholesterolClassification.getPageContent()}
    </PageLayout>
  );
}
