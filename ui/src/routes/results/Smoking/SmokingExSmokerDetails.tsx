import { DoAndDontList, Details } from 'nhsuk-react-components';
import {
  type IHealthCheck,
  SmokingCategory,
  AuditEventType
} from '@dnhc-health-checks/shared';
import { type SmokingPageDetails, SmokingResultColor } from './SmokingBase';
import {
  OpenedFrom,
  OpensInNewTabLink
} from '../../../lib/components/opens-in-new-tab-link';
import { PhoneAnchor } from '../../../lib/components/phone-anchor';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

export class SmokingExSmokerDetails implements SmokingPageDetails {
  private readonly healthCheck?: IHealthCheck;

  constructor(healthCheck?: IHealthCheck) {
    this.healthCheck = healthCheck;
  }
  readonly displaySmokingResultColor = SmokingCategory.ExSmoker;
  readonly SmokingResultColor = SmokingResultColor.Yellow;

  getPageContent(): JSX.Element {
    return (
      <>
        {this.getBenefitsSection()}
        {this.getMiddleSection()}
        {this.getImportantNote()}
      </>
    );
  }
  getImportantNote(): JSX.Element {
    return (
      <>
        <Details expander>
          <Details.Summary>Vaping to quit smoking</Details.Summary>
          <Details.Text>
            <p>
              Nearly two-thirds of people who use vapes with Stop Smoking
              Services quit smoking.
            </p>
            <p>
              Nicotine vapes are less harmful than cigarettes. They don’t
              produce tar or carbon monoxide, which cause cancer, lung disease,
              and heart disease.
            </p>
            <p>
              Vaping mimics smoking with hand-to-mouth movement and helps manage
              nicotine cravings.
            </p>
            <p>
              Vaping also costs about a third as much as smoking, once you have
              the kit.
            </p>
            <p>
              Vaping is not risk-free. It is not recommended for non smokers or
              those under 18 years old.
            </p>
            <h3>Useful resources</h3>
            <p>The following links open in a new tab.</p>
            <p>
              Visit a vape shop or{' '}
              <OpensInNewTabLink
                linkHref="https://www.nhs.uk/better-health/quit-smoking/find-your-local-stop-smoking-service/"
                linkText="local Stop Smoking Service"
                includeNewTabMessage={false}
                auditEventTriggeredOnClick={{
                  eventType: AuditEventType.ExternalResourceOpened,
                  openedFrom: OpenedFrom.ResultsSmoking,
                  healthCheck: this.healthCheck
                }}
              />{' '}
              for advice
            </p>
            <p>
              Read{' '}
              <OpensInNewTabLink
                linkHref="https://www.nhs.uk/better-health/quit-smoking/vaping-to-quit-smoking/"
                linkText="NHS guidance on vaping to quit smoking"
                includeNewTabMessage={false}
                auditEventTriggeredOnClick={{
                  eventType: AuditEventType.ExternalResourceOpened,
                  openedFrom: OpenedFrom.ResultsSmoking,
                  healthCheck: this.healthCheck
                }}
              />
            </p>
            <h3>Want to quit vaping?</h3>
            <p>
              To quit vaping, gradually reduce nicotine strength or usage. Seek
              advice from a vape shop or local Stop Smoking Service.
            </p>
          </Details.Text>
        </Details>
        <Details expander>
          <Details.Summary>Smoking, anxiety and mood</Details.Summary>
          <Details.Text>
            <p>
              Quitting smoking can lift your mood, and ease stress, anxiety, and
              depression.
            </p>
            <p>
              Smokers often think that smoking helps them relax. But in reality,
              nicotine cravings increase anxiety and tension.
            </p>
            <p>To manage cravings, try to:</p>
            <ul>
              <li>keep busy with hobbies and activities</li>
              <li>relax with breathing techniques or meditation</li>
              <li>seek support from friends, family, or support groups</li>
              <li>use nicotine replacement therapy or medications</li>
            </ul>
            <p>The following links open in a new tab.</p>
            <p>
              Read{' '}
              <OpensInNewTabLink
                linkHref="https://www.nhs.uk/live-well/quit-smoking/stopping-smoking-mental-health-benefits/"
                linkText="NHS guidance on smoking and mental health"
                includeNewTabMessage={false}
                auditEventTriggeredOnClick={{
                  eventType: AuditEventType.ExternalResourceOpened,
                  openedFrom: OpenedFrom.ResultsSmoking,
                  healthCheck: this.healthCheck
                }}
              />
              <br />
              Get your{' '}
              <OpensInNewTabLink
                linkHref="https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/your-mind-plan-quiz/"
                linkText="free Mind Plan"
                includeNewTabMessage={false}
                auditEventTriggeredOnClick={{
                  eventType: AuditEventType.ExternalResourceOpened,
                  openedFrom: OpenedFrom.ResultsSmoking,
                  healthCheck: this.healthCheck
                }}
              />
            </p>
          </Details.Text>
        </Details>
        <h2>Useful resources</h2>
        <p>The following links open in a new tab.</p>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/better-health/quit-smoking/"
            linkText="NHS guidance on smoking"
            includeNewTabMessage={false}
            auditEventTriggeredOnClick={{
              eventType: AuditEventType.ExternalResourceOpened,
              openedFrom: OpenedFrom.ResultsSmoking,
              healthCheck: this.healthCheck
            }}
          />
        </p>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/better-health/quit-smoking/vaping-to-quit-smoking/"
            linkText="NHS guidance on vaping"
            includeNewTabMessage={false}
            auditEventTriggeredOnClick={{
              eventType: AuditEventType.ExternalResourceOpened,
              openedFrom: OpenedFrom.ResultsSmoking,
              healthCheck: this.healthCheck
            }}
          />
        </p>
      </>
    );
  }
  getRiskDescription(): JSX.Element {
    return (
      <p>
        This lowers your risk of cancer, lung disease, heart disease, stroke and
        dementia.
      </p>
    );
  }
  getBenefitsSection(): JSX.Element {
    return (
      <>
        <h2>The benefits of not smoking</h2>
        <p>
          You&apos;ve made a great choice for your health by stopping smoking.
        </p>
        <p>Look at what happens when you quit.</p>
        <ul>
          <li>
            After 1 year, your risk of a heart attack is half that of a smoker
          </li>
          <li>
            After 10 years, your risk of death from lung cancer is half that of
            a smoker
          </li>
          <li>
            After 15 years, your risk of heart attack is the same as someone who
            never smoked
          </li>
        </ul>
      </>
    );
  }
  getMiddleSection(): JSX.Element {
    return (
      <>
        <h2>Support to stay smoke-free</h2>
        <p>
          There is plenty of support and help available to help you stay
          smoke-free if you need it.
        </p>
        <DoAndDontList listType="do" heading="For free help and support:">
          <DoAndDontList.Item>
            find your nearest{' '}
            <OpensInNewTabLink
              linkHref="https://www.nhs.uk/better-health/quit-smoking/find-your-local-stop-smoking-service/"
              linkText="local Stop Smoking Service"
              includeNewTabMessage={false}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsSmoking,
                healthCheck: this.healthCheck
              }}
            />
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            get a{' '}
            <OpensInNewTabLink
              linkHref="https://www.nhs.uk/better-health/quit-smoking/personal-quit-plan/"
              linkText="free personal quit plan"
              includeNewTabMessage={false}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsSmoking,
                healthCheck: this.healthCheck
              }}
            />
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            join the{' '}
            <OpensInNewTabLink
              linkHref="https://www.facebook.com/login/?next=https%3A%2F%2Fwww.facebook.com%2Fgroups%2F707621863012993%2F%3Fsource_id%3D162994267161135"
              linkText="Quit Smoking Group on Facebook"
              includeNewTabMessage={false}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsSmoking,
                healthCheck: this.healthCheck
              }}
            />
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            read{' '}
            <OpensInNewTabLink
              linkHref="https://www.nhs.uk/better-health/quit-smoking/"
              linkText="NHS guidance on smoking"
              includeNewTabMessage={false}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsSmoking,
                healthCheck: this.healthCheck
              }}
            />
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            call the free National Smokefree Helpline on{' '}
            <PhoneAnchor
              phoneNumber="0300 123 1044"
              phoneNumberForScreenReaders="zero three zero zero one two three one zero four four"
              displayText="0300 123 1044"
            ></PhoneAnchor>{' '}
            (England only)
          </DoAndDontList.Item>
        </DoAndDontList>
      </>
    );
  }
  headingMessage(): string {
    return EnumDescriptions.Smoking.Quitted.heading;
  }
}
