import { Details, DoAndDontList, InsetText } from 'nhsuk-react-components';
import {
  type IHealthCheck,
  SmokingCategory,
  type Smoking,
  AuditEventType
} from '@dnhc-health-checks/shared';
import { type SmokingPageDetails, SmokingResultColor } from './SmokingBase';
import {
  OpenedFrom,
  OpensInNewTabLink
} from '../../../lib/components/opens-in-new-tab-link';
import { PhoneAnchor } from '../../../lib/components/phone-anchor';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

export class SmokingCurrentSmokerDetails implements SmokingPageDetails {
  private readonly heading: string;
  private readonly healthCheck?: IHealthCheck;

  constructor(questionnaireSmoking: Smoking, healthCheck?: IHealthCheck) {
    this.heading = EnumDescriptions.Smoking[questionnaireSmoking].heading;
    this.healthCheck = healthCheck;
  }
  readonly displaySmokingResultColor = SmokingCategory.CurrentSmoker;
  readonly SmokingResultColor = SmokingResultColor.Red;
  getPageContent(): JSX.Element {
    return (
      <>
        {this.getMiddleSection()}
        {this.getBenefitsSection()}
        {this.helpQuittingSection()}
        {this.getImportantNote()}
      </>
    );
  }
  getImportantNote(): JSX.Element {
    return <></>;
  }
  getRiskDescription(): JSX.Element {
    return (
      <p>
        This increases your risk of getting cancer, lung disease, heart disease,
        stroke and dementia.
      </p>
    );
  }
  getBenefitsSection(): JSX.Element {
    return (
      <>
        <DoAndDontList listType="do" heading="When you quit, you:">
          <DoAndDontList.Item>
            lower your risk of cancer, lung disease, heart disease, stroke and
            dementia
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            protect your loved ones and pets from secondhand smoke
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            feel better mentally in as little as 6 weeks
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            save money - around £38 a week for the average smoker
          </DoAndDontList.Item>
          <DoAndDontList.Item>increase energy levels</DoAndDontList.Item>
          <DoAndDontList.Item>
            look better and have healthier skin
          </DoAndDontList.Item>
        </DoAndDontList>
        <h2>It’s never too late to stop</h2>
        <p>
          When you stop smoking, your body can repair itself sooner than you
          might think. It does not matter how old you are, or how long you have
          smoked.
        </p>
        <InsetText
          className={
            SmokingResultColor.Blue +
            ' nhsuk-u-margin-top-5 nhsuk-u-margin-bottom-5'
          }
        >
          <p>When you stop smoking, in:</p>
          <ul>
            <li>2 days, all harmful carbon monoxide leaves your body</li>
            <li>2 to 12 weeks, your circulation improves</li>
            <li>3 to 9 months, your lung function and breathing improves</li>
            <li>
              1 year, your risk of a heart attack halves compared to a smoker
            </li>
          </ul>
        </InsetText>
      </>
    );
  }
  getMiddleSection(): JSX.Element {
    return (
      <>
        <h2>Benefits of stopping smoking</h2>
        <p>
          Stopping smoking is a great way to stay healthy, protect the health of
          those around you, and enjoy a better quality of life.
        </p>
      </>
    );
  }
  headingMessage(): string {
    return this.heading;
  }
  helpQuittingSection(): JSX.Element {
    return (
      <>
        <DoAndDontList listType="do" heading="To help stop smoking: ">
          <DoAndDontList.Item>
            talk to your GP or pharmacy about stop smoking aids, medication and
            support services
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            set small goals - you’re 5 times more likely to quit for good if you
            stop smoking for 28 days
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            reflect on any past attempts to quit and try new methods
          </DoAndDontList.Item>
        </DoAndDontList>
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
        <DoAndDontList listType="do" heading="For free help and support: ">
          <DoAndDontList.Item>
            find your nearest local{' '}
            <OpensInNewTabLink
              linkHref="https://www.nhs.uk/better-health/quit-smoking/find-your-local-stop-smoking-service/"
              linkText="Stop Smoking Service"
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
          <DoAndDontList.Item>
            download the NHS Quit Smoking app from the{' '}
            <OpensInNewTabLink
              linkHref="https://apps.apple.com/gb/app/nhs-quit-smoking/id687298065"
              linkText="Apple App Store"
              includeNewTabMessage={false}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsSmoking,
                healthCheck: this.healthCheck
              }}
            />{' '}
            or{' '}
            <OpensInNewTabLink
              linkHref=" https://play.google.com/store/apps/details?id=com.doh.smokefree&hl=en_GB&gl=US"
              linkText="Google Play Store"
              includeNewTabMessage={false}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsSmoking,
                healthCheck: this.healthCheck
              }}
            />
          </DoAndDontList.Item>
        </DoAndDontList>
      </>
    );
  }
}
