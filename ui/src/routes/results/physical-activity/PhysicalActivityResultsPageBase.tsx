import {
  Card,
  Details,
  DoAndDontList,
  InsetText
} from 'nhsuk-react-components';
import {
  type ActivityCategory,
  AuditEventType
} from '@dnhc-health-checks/shared';
import {
  OpenedFrom,
  OpensInNewTabLink
} from '../../../lib/components/opens-in-new-tab-link';
import { RiskLevelColor } from '../../../lib/models/RiskLevelColor';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';
import { useHealthCheck } from '../../../hooks/healthCheckHooks';

export abstract class PhysicalActivityResultsPageBase {
  abstract readonly riskLevelDescription: string;
  readonly activityCategory: ActivityCategory;
  readonly riskLevelColor: RiskLevelColor;
  protected readonly healthCheck = useHealthCheck();

  constructor(
    activityCategory: ActivityCategory,
    riskLevelColor: RiskLevelColor
  ) {
    this.activityCategory = activityCategory;
    this.riskLevelColor = riskLevelColor;
  }

  getPage(): JSX.Element {
    return (
      <>
        <h1 className="nhsuk-heading-xl nhsuk-u-margin-bottom-5">
          Physical activity results
        </h1>
        {this.getTopCard()}
        {this.getRiskLevelDetails()}
        {this.getMainContent()}
        {this.getActivitiesForPeopleWithDisabilities()}
        {this.getUsefulResources()}
      </>
    );
  }

  getTopCard(): JSX.Element {
    return (
      <Card>
        <Card.Content>
          <Card.Heading
            aria-label={`Your physical activity level is ${EnumDescriptions.ActivityCategory[this.activityCategory].toLowerCase()}`}
          >
            Your physical activity level is{' '}
            {EnumDescriptions.ActivityCategory[
              this.activityCategory
            ].toLowerCase()}
          </Card.Heading>
          {this.getRiskLevelInsetText()}
        </Card.Content>
      </Card>
    );
  }

  getRiskLevelInsetText(): JSX.Element {
    return (
      <InsetText
        id="risk-level-description"
        className={this.riskLevelColor + ' nhsuk-u-margin-top-5'}
      >
        <p id="risk-level">{this.riskLevelDescription}</p>
      </InsetText>
    );
  }

  getRiskLevelDetails() {
    return (
      <Details>
        <Details.Summary>
          How is my physical activity level calculated?
        </Details.Summary>
        <Details.Text>
          We calculate your activity level based on:
          <ul className="nhsuk-u-margin-top-4">
            <li>how much you exercise</li>
            <li>how much you cycle</li>
            <li>how much physical movement you use in your job</li>
          </ul>
          <p>
            Your activity level does not include movements like walking,
            housework, or care for a child or family member. However, these
            activities can still make a positive difference to your health.
          </p>
        </Details.Text>
      </Details>
    );
  }

  getModerateVigorousActivitiesExaplanation(): JSX.Element {
    return (
      <Details>
        <Details.Summary>
          What are moderate and vigorous activities?
        </Details.Summary>
        <Details.Text>
          <p>A moderate intensity activity will:</p>
          <ul>
            <li>raise your heart rate</li>
            <li>make you breathe faster</li>
            <li>make you feel warmer</li>
          </ul>
          <p>
            One way to tell if you&apos;re working at this level is if you can
            still talk, but not sing.
          </p>
          <p>
            The sign of a vigorous intensity activity is having difficulty
            talking without pausing.
          </p>
        </Details.Text>
      </Details>
    );
  }

  getTry10MinuteWalk(): JSX.Element {
    return (
      <>
        <h2>Try a 10 minute walk</h2>
        <p>
          Walking is a free, easy way to boost your daily activity. Just 10
          minutes of brisk walking a day can greatly improve your mood, burn
          calories and strengthen your heart.
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

  getActivitiesForPeopleWithDisabilities(): JSX.Element {
    return (
      <Details expander>
        <Details.Summary>
          Activities for people with disabilities
        </Details.Summary>
        <Details.Text>
          <p>
            When you’re managing a health condition, being active is about
            finding what works for you.
          </p>
          <p>Try to incorporate some movement into your routine every day.</p>
          <h3>
            Find out more about movement with a disability or health condition
          </h3>

          <p>The following links open in a new tab.</p>
          <p>
            <OpensInNewTabLink
              linkHref="https://www.sportengland.org/funds-and-campaigns/we-are-undefeatable"
              linkText="Sport England: We Are Undefeatable"
              includeNewTabMessage={false}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsPhysicalActivity,
                healthCheck: this.healthCheck.data
              }}
            />
          </p>
          <p>
            <OpensInNewTabLink
              linkHref="https://www.scope.org.uk"
              linkText="Disability charity Scope UK"
              includeNewTabMessage={false}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsPhysicalActivity,
                healthCheck: this.healthCheck.data
              }}
            />
          </p>
          <p>
            <OpensInNewTabLink
              linkHref="https://www.nhs.uk/live-well/exercise/wheelchair-users-fitness-advice/"
              linkText="NHS fitness advice for wheelchair users"
              includeNewTabMessage={false}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsPhysicalActivity,
                healthCheck: this.healthCheck.data
              }}
            />
          </p>
        </Details.Text>
      </Details>
    );
  }

  getUsefulResources(): JSX.Element {
    return (
      <>
        <h2>Useful resources</h2>
        <p>The following links open in a new tab.</p>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/live-well/exercise/"
            linkText="NHS fitness guidelines and workouts"
            includeNewTabMessage={false}
            auditEventTriggeredOnClick={{
              eventType: AuditEventType.ExternalResourceOpened,
              openedFrom: OpenedFrom.ResultsPhysicalActivity,
              healthCheck: this.healthCheck.data
            }}
          />
        </p>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.sportengland.org/get-moving"
            linkText="Sport England: Get Moving"
            includeNewTabMessage={false}
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

  getBenefitsOfBeingActiveInset(): JSX.Element {
    return (
      <InsetText
        className={
          RiskLevelColor.Blue + ' nhsuk-u-margin-top-5 nhsuk-u-margin-bottom-5'
        }
      >
        <p>
          Exercising regularly at moderate intensity can reduce your chance of:
        </p>
        <ul>
          <li>type 2 diabetes by 40%</li>
          <li>cardiovascular disease by 35%</li>
          <li>joint and back pain by 25%</li>
          <li>cancer (colon and breast) by 20%</li>
        </ul>
      </InsetText>
    );
  }

  getDos(): JSX.Element {
    return (
      <DoAndDontList listType="do" heading="Do">
        <li>The following links open in a new tab.</li>
        <DoAndDontList.Item>
          20 to 30 minutes of moderate to vigorous activity every day
        </DoAndDontList.Item>
        <DoAndDontList.Item>
          strength exercises at least twice a week with the{' '}
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
          reduce long periods of inactivity at home with a{' '}
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
      </DoAndDontList>
    );
  }

  abstract getMainContent(): JSX.Element;
}
