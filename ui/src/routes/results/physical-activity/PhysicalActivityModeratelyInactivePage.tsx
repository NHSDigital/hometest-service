import { DoAndDontList } from 'nhsuk-react-components';
import { ActivityCategory, AuditEventType } from '@dnhc-health-checks/shared';
import {
  OpenedFrom,
  OpensInNewTabLink
} from '../../../lib/components/opens-in-new-tab-link';
import { PhysicalActivityResultsPageBase } from './PhysicalActivityResultsPageBase';
import { RiskLevelColor } from '../../../lib/models/RiskLevelColor';

export abstract class PhysicalActivityModeratelyInactivePage extends PhysicalActivityResultsPageBase {
  readonly riskLevelDescription =
    'This means that you exercise for less than 1 hour each week, or your job involves mostly sitting.';

  constructor() {
    super(ActivityCategory.ModeratelyInactive, RiskLevelColor.Yellow);
  }
  abstract getMainContent(): JSX.Element;

  getMovingMore(): JSX.Element {
    return (
      <>
        <h2>Get moving more</h2>
        <p>
          You&apos;re already exercising, which is great. Any amount is good for
          your body and mind, but more is even better.
        </p>
        <p>
          Try to do 20 to 30 minutes of moderate intensity activity a day. Also,
          aim to do strengthening exercises at least 2 days a week.
        </p>
        {this.getModerateVigorousActivitiesExaplanation()}
      </>
    );
  }

  getNextSteps(): JSX.Element {
    return (
      <DoAndDontList listType="do" heading="What can I do next?">
        <li>The following links open in a new tab.</li>
        <DoAndDontList.Item>
          break exercise into smaller sessions, like two 10 minute workouts
          daily
        </DoAndDontList.Item>
        <DoAndDontList.Item>
          try a{' '}
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/conditions/nhs-fitness-studio/"
            linkText="free online home workout"
            includeNewTabMessage={false}
            auditEventTriggeredOnClick={{
              eventType: AuditEventType.ExternalResourceOpened,
              openedFrom: OpenedFrom.ResultsPhysicalActivity,
              healthCheck: this.healthCheck.data
            }}
          />
        </DoAndDontList.Item>
        <DoAndDontList.Item>
          try a free{' '}
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/better-health/get-active/"
            linkText="NHS app"
            includeNewTabMessage={false}
            auditEventTriggeredOnClick={{
              eventType: AuditEventType.ExternalResourceOpened,
              openedFrom: OpenedFrom.ResultsPhysicalActivity,
              healthCheck: this.healthCheck.data
            }}
          />{' '}
          like Active 10 for walking, or Couch to 5k for a gradual introduction
          to running
        </DoAndDontList.Item>
        <DoAndDontList.Item>
          build strength with the{' '}
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/live-well/exercise/strength-and-flex-exercise-plan-how-to-videos/"
            linkText="NHS strength and flex programme"
            includeNewTabMessage={false}
            auditEventTriggeredOnClick={{
              eventType: AuditEventType.ExternalResourceOpened,
              openedFrom: OpenedFrom.ResultsPhysicalActivity,
              healthCheck: this.healthCheck.data
            }}
          />
        </DoAndDontList.Item>
      </DoAndDontList>
    );
  }
}

export class PhysicalActivityModeratelyInactiveNoWalkingPage extends PhysicalActivityModeratelyInactivePage {
  getMainContent(): JSX.Element {
    return (
      <>
        {this.getMovingMore()}
        {this.getTry10MinuteWalk()}
        {this.getNextSteps()}
      </>
    );
  }
}

export class PhysicalActivityModeratelyInactiveBelow1HourWalkingPage extends PhysicalActivityModeratelyInactivePage {
  getMainContent(): JSX.Element {
    return (
      <>
        {this.getMovingMore()}
        {this.getKeepOnWalking()}
        {this.getNextSteps()}
      </>
    );
  }

  getKeepOnWalking(): JSX.Element {
    return (
      <>
        <h2>Keep on walking</h2>
        <p>
          The walking you do each week is a good start towards being more
          active.
        </p>
        <p>
          Just 10 minutes of brisk walking a day can greatly improve your mood,
          burn calories and strengthen your heart.
        </p>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/live-well/exercise/walking-for-health/"
            linkText="Read NHS guidance on walking for health"
            includeNewTabMessage={true}
            auditEventTriggeredOnClick={{
              eventType: AuditEventType.ExternalResourceOpened,
              openedFrom: OpenedFrom.ResultsPhysicalActivity,
              healthCheck: this.healthCheck.data
            }}
          />
        </p>
      </>
    );
  }
}

export class PhysicalActivityModeratelyInactiveBetween1And3HoursWalkingPage extends PhysicalActivityModeratelyInactivePage {
  getMainContent(): JSX.Element {
    return (
      <>
        {this.getMovingMore()}
        {this.getKeepOnWalking()}
        {this.getNextSteps()}
      </>
    );
  }

  getKeepOnWalking(): JSX.Element {
    return (
      <>
        <h2>Keep on walking</h2>
        <p>
          The walking you do each week is a good start towards being more
          active.
        </p>
        <p>
          Keep it up by doing a little more each day, and make sure it’s at a
          brisk pace
        </p>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/live-well/exercise/walking-for-health/"
            linkText="Read NHS guidance on walking for health"
            includeNewTabMessage={true}
            auditEventTriggeredOnClick={{
              eventType: AuditEventType.ExternalResourceOpened,
              openedFrom: OpenedFrom.ResultsPhysicalActivity,
              healthCheck: this.healthCheck.data
            }}
          />
        </p>
      </>
    );
  }
}

export class PhysicalActivityModeratelyInactive3HourOrMoreWalkingPage extends PhysicalActivityModeratelyInactivePage {
  getMainContent(): JSX.Element {
    return (
      <>
        {this.getMovingMore()}
        {this.getKeepOnWalking()}
        {this.getNextSteps()}
      </>
    );
  }

  getKeepOnWalking(): JSX.Element {
    return (
      <>
        <h2>Keep on walking</h2>
        <p>By walking over 3 hours a week, you’re building good habits.</p>
        <p>
          Make sure you’re walking at a brisk pace. At this pace you should be
          able to talk but not sing.
        </p>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/live-well/exercise/walking-for-health/"
            linkText="Read NHS guidance on walking for health"
            includeNewTabMessage={true}
            auditEventTriggeredOnClick={{
              eventType: AuditEventType.ExternalResourceOpened,
              openedFrom: OpenedFrom.ResultsPhysicalActivity,
              healthCheck: this.healthCheck.data
            }}
          />
        </p>
      </>
    );
  }
}
