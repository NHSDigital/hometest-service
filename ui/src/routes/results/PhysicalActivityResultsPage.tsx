import PageLayout from '../../layouts/PageLayout';
import { RoutePath } from '../../lib/models/route-paths';
import { useAuditEvent } from '../../hooks/eventAuditHook';
import { useEffect } from 'react';
import { useHealthCheck } from '../../hooks/healthCheckHooks';
import { Redirecting } from '../../lib/pages/redirecting';
import {
  ActivityCategory,
  ExerciseHours,
  AuditEventType,
  PatientResultsDetailedOpenedPage
} from '@dnhc-health-checks/shared';
import { PhysicalActivityActivePage } from './physical-activity/PhysicalActivityActivePage';
import {
  PhysicalActivityInactive3HourOrMoreWalkingPage,
  PhysicalActivityInactiveBelow1HourWalkingPage,
  PhysicalActivityInactiveBetween1And3HoursWalkingPage,
  PhysicalActivityInactiveNoWalkingPage
} from './physical-activity/PhysicalActivityInactivePage';
import {
  PhysicalActivityModeratelyInactive3HourOrMoreWalkingPage,
  PhysicalActivityModeratelyInactiveBelow1HourWalkingPage,
  PhysicalActivityModeratelyInactiveBetween1And3HoursWalkingPage,
  PhysicalActivityModeratelyInactiveNoWalkingPage
} from './physical-activity/PhysicalActivityModeratelyInactivePage';
import { PhysicalActivityModeratelyActivePage } from './physical-activity/PhysicalActivityModeratelyActivePage';
import { type PhysicalActivityResultsPageBase } from './physical-activity/PhysicalActivityResultsPageBase';
import { Spinner } from '../../lib/pages/spinner';

export default function PhysicalActivityResultsPage() {
  const healthCheck = useHealthCheck();
  const { triggerAuditEvent } = useAuditEvent();

  useEffect(() => {
    void triggerAuditEvent({
      eventType: AuditEventType.PatientResultsDetailedOpened,
      healthCheck: healthCheck.data,
      details: { page: PatientResultsDetailedOpenedPage.PhysicalActivity }
    });
  }, [healthCheck.data, triggerAuditEvent]);

  if (healthCheck.isPending) {
    return <Spinner />;
  }
  if (healthCheck.isError) {
    return <Redirecting />;
  }

  const activityCategory = healthCheck.data!.questionnaireScores
    ?.activityCategory as ActivityCategory;
  const walkHours: ExerciseHours =
    healthCheck.data!.questionnaire.walkHours ?? ExerciseHours.None;

  const page = determinePageVersion(activityCategory, walkHours);

  return (
    <PageLayout backToUrl={RoutePath.MainResultsPage}>
      {page.getPage()}
    </PageLayout>
  );

  function determinePageVersion(
    activityCategory: ActivityCategory,
    walkHours: ExerciseHours
  ): PhysicalActivityResultsPageBase {
    switch (activityCategory) {
      case ActivityCategory.Inactive:
        switch (walkHours) {
          case ExerciseHours.LessThanOne:
            return new PhysicalActivityInactiveBelow1HourWalkingPage();
          case ExerciseHours.BetweenOneAndThree:
            return new PhysicalActivityInactiveBetween1And3HoursWalkingPage();
          case ExerciseHours.ThreeHoursOrMore:
            return new PhysicalActivityInactive3HourOrMoreWalkingPage();
          default:
            return new PhysicalActivityInactiveNoWalkingPage();
        }
      case ActivityCategory.ModeratelyInactive:
        switch (walkHours) {
          case ExerciseHours.LessThanOne:
            return new PhysicalActivityModeratelyInactiveBelow1HourWalkingPage();
          case ExerciseHours.BetweenOneAndThree:
            return new PhysicalActivityModeratelyInactiveBetween1And3HoursWalkingPage();
          case ExerciseHours.ThreeHoursOrMore:
            return new PhysicalActivityModeratelyInactive3HourOrMoreWalkingPage();
          default:
            return new PhysicalActivityModeratelyInactiveNoWalkingPage();
        }
      case ActivityCategory.ModeratelyActive:
        return new PhysicalActivityModeratelyActivePage();
      case ActivityCategory.Active:
        return new PhysicalActivityActivePage();
      default:
        throw new Error(
          `Unhandled activity category: ${String(activityCategory)}`
        );
    }
  }
}
