import { DoAndDontList } from 'nhsuk-react-components';
import {
  OpenedFrom,
  OpensInNewTabLink
} from '../../../lib/components/opens-in-new-tab-link';
import { ActivityCategory, AuditEventType } from '@dnhc-health-checks/shared';
import { PhysicalActivityResultsPageBase } from './PhysicalActivityResultsPageBase';
import { RiskLevelColor } from '../../../lib/models/RiskLevelColor';

export abstract class PhysicalActivityInactivePage extends PhysicalActivityResultsPageBase {
  readonly riskLevelDescription =
    'This means that you do not exercise regularly or cycle, or your job involves mostly sitting.';

  constructor() {
    super(ActivityCategory.Inactive, RiskLevelColor.Red);
  }

  abstract getMainContent(): JSX.Element;

  getStartSmallAndBuildUp(): JSX.Element {
    return (
      <>
        <h2>Start small and build up</h2>
        <p>
          It can be daunting to start doing physical activity, but however you
          choose to move, it’s all good for your health.
        </p>
        <p>
          You can start small and build up. Over time, 20 to 30 minutes of
          moderate intensity activity a day can help you feel happier and
          healthier.
        </p>
        {this.getModerateVigorousActivitiesExaplanation()}
      </>
    );
  }

  getNextSteps(displaySmallChanges: boolean): JSX.Element {
    return (
      <DoAndDontList listType="do" heading="What can I do next?">
        <li>The following links open in a new tab.</li>
        {displaySmallChanges && (
          <DoAndDontList.Item>
            make small changes to your daily routine, like some gentle
            stretching while the kettle boils, or dancing while you cook
          </DoAndDontList.Item>
        )}
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
          />
          like Active 10 for walking, or Couch to 5k for a gradual introduction
          to running
        </DoAndDontList.Item>
        <DoAndDontList.Item>
          choose activities you enjoy – you’re more likely to keep doing them
        </DoAndDontList.Item>
      </DoAndDontList>
    );
  }
}

export class PhysicalActivityInactiveNoWalkingPage extends PhysicalActivityInactivePage {
  getMainContent(): JSX.Element {
    return (
      <>
        {this.getStartSmallAndBuildUp()}
        {this.getTry10MinuteWalk()}
        {this.getNextSteps(true)}
      </>
    );
  }
}

export class PhysicalActivityInactiveBelow1HourWalkingPage extends PhysicalActivityInactivePage {
  getMainContent(): JSX.Element {
    return (
      <>
        {this.getStartSmallAndBuildUp()}
        {this.getKeepOnWalking()}
        {this.getNextSteps(true)}
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

export class PhysicalActivityInactiveBetween1And3HoursWalkingPage extends PhysicalActivityInactivePage {
  getMainContent(): JSX.Element {
    return (
      <>
        {this.getStartSmallAndBuildUp()}
        {this.getKeepOnWalking()}
        {this.getNextSteps(true)}
      </>
    );
  }

  getKeepOnWalking(): JSX.Element {
    return (
      <>
        <h2>Keep on walking</h2>
        <p>
          The walking you do is a good start towards being more active. Keep it
          up by doing a little more each day. It all counts towards your 150
          minutes of weekly exercise.
        </p>
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

export class PhysicalActivityInactive3HourOrMoreWalkingPage extends PhysicalActivityInactivePage {
  getMainContent(): JSX.Element {
    return (
      <>
        {this.getKeepOnWalking()}
        {this.getMovingMore()}
        {this.getNextSteps(false)}
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

  getMovingMore(): JSX.Element {
    return (
      <>
        <h2>Get moving more</h2>
        <p>
          Walking is a great activity, but you should also try to do 20 to 30
          minutes of moderate intensity activity a day.
        </p>
        <p>
          You should also aim to do strengthening exercises at least 2 days a
          week.
        </p>
        <p>
          Try running, cycling, swimming or strength training. This will help
          build muscle, improve your heart health, and boost your mood.
        </p>
        {this.getModerateVigorousActivitiesExaplanation()}
      </>
    );
  }
}
