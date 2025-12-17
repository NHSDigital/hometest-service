import { Details, DoAndDontList } from 'nhsuk-react-components';
import {
  AuditCategory,
  type IHealthCheck,
  AuditEventType
} from '@dnhc-health-checks/shared';
import { PhoneAnchor } from '../../lib/components/phone-anchor';
import { ImportantCallout } from '../../lib/components/important-callout';
import {
  OpenedFrom,
  OpensInNewTabLink
} from '../../lib/components/opens-in-new-tab-link';

let healthcheck: IHealthCheck | undefined;

export enum RiskLevelColor {
  Green = 'app-card__heading-inset--green',
  Yellow = 'app-card__heading-inset--yellow',
  Red = 'app-card__heading-inset--red'
}

export interface AlcoholPageDetails {
  displayRiskLevel: AuditCategory;
  riskLevelColor: RiskLevelColor;
  getMiddleSection: () => JSX.Element;
  getBenefitsSection: () => JSX.Element;
  getRiskDescription: () => JSX.Element;
  getImportantNote: () => JSX.Element;
}

// covers NoRisk and LowRisk
export class AlcoholLowRiskDetails implements AlcoholPageDetails {
  readonly displayRiskLevel = AuditCategory.LowRisk;
  readonly riskLevelColor = RiskLevelColor.Green;
  readonly riskScore: number;

  constructor(riskScore: number, healthCheck?: IHealthCheck) {
    this.riskScore = riskScore;
    healthcheck = healthCheck;
  }

  getBenefitsSection(): JSX.Element {
    return (
      <>
        <h2>Benefits of lower risk drinking</h2>
        <p>
          Keeping your drinking low risk is a great way to look after your
          physical and mental health. It can also boost your energy and save you
          money.
        </p>
        <DoAndDontList
          listType="do"
          heading="Tips to keep your drinking low risk"
        >
          <DoAndDontList.Item>
            go for smaller sizes - for example bottled beer instead of pints
          </DoAndDontList.Item>
          <DoAndDontList.Item>have a lower strength drink</DoAndDontList.Item>
          <DoAndDontList.Item>
            alternate alcohol with water or soft drinks
          </DoAndDontList.Item>
        </DoAndDontList>

        <DoAndDontList listType="do" heading="Free help and support">
          <DoAndDontList.Item>
            find out about the{' '}
            <OpensInNewTabLink
              linkHref="https://www.nhs.uk/better-health/drink-less/"
              linkText="Drink Free Days app"
              includeNewTabMessage={true}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsAlcohol,
                healthCheck: healthcheck
              }}
            />
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            find out more about{' '}
            <OpensInNewTabLink
              linkHref="https://www.nhs.uk/pregnancy/keeping-well/drinking-alcohol-while-pregnant/"
              linkText="Drinking alcohol while pregnant"
              includeNewTabMessage={true}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsAlcohol,
                healthCheck: healthcheck
              }}
            />
          </DoAndDontList.Item>
        </DoAndDontList>
      </>
    );
  }

  getImportantNote(): JSX.Element {
    return <></>;
  }

  getRiskDescription(): JSX.Element {
    return (
      <>
        <p>
          Your score is {this.riskScore}. You’re at low risk of alcohol-related
          health problems.
        </p>
        <p>
          There&apos;s no safe drinking level, but the less you drink, the lower
          the risk. By keeping it low risk you’re making a good choice.
        </p>
      </>
    );
  }

  getMiddleSection(): JSX.Element {
    return (
      <>
        <h2>Keeping your risk low</h2>
        <p>
          The UK Chief Medical Officers advise you to follow these guidelines,
          if you’re not already:
        </p>
        {getChiefOfficerAdvice()}
        {renderUnitsOfAlcoholGuide()}
      </>
    );
  }
}

export class AlcoholIncreasingRiskDetails implements AlcoholPageDetails {
  readonly displayRiskLevel = AuditCategory.IncreasingRisk;
  readonly riskLevelColor = RiskLevelColor.Yellow;
  readonly riskScore: number;

  constructor(riskScore: number, healthCheck?: IHealthCheck) {
    this.riskScore = riskScore;
    healthcheck = healthCheck;
  }

  getBenefitsSection(): JSX.Element {
    return (
      <>
        <h2>Benefits of cutting down</h2>
        <p>
          In the short term, if you drink less you could have more energy,
          better skin and save money.
        </p>
        <p>
          Long term, you can reduce your risk of serious illness, improve your
          mood and get better sleep.
        </p>
        <DoAndDontList listType="do" heading="Tips on cutting down">
          <DoAndDontList.Item>
            make a plan - set a limit on how much you drink and keep track of it
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            have smaller or lower-strength drinks
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            alternate alcohol with water or soft drinks
          </DoAndDontList.Item>
        </DoAndDontList>

        <DoAndDontList listType="do" heading="Free help and support">
          <DoAndDontList.Item>
            find out about the{' '}
            <OpensInNewTabLink
              linkHref="https://www.nhs.uk/better-health/drink-less/"
              linkText="Drink Free Days app"
              includeNewTabMessage={true}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsAlcohol,
                healthCheck: healthcheck
              }}
            />
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            read the{' '}
            <OpensInNewTabLink
              linkHref="https://www.nhs.uk/live-well/alcohol-advice/tips-on-cutting-down-alcohol/"
              linkText="NHS tips on cutting down"
              includeNewTabMessage={true}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsAlcohol,
                healthCheck: healthcheck
              }}
            />
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            check{' '}
            <OpensInNewTabLink
              linkHref="https://www.nhs.uk/live-well/alcohol-advice/alcohol-support/"
              linkText="NHS alcohol support"
              includeNewTabMessage={true}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsAlcohol,
                healthCheck: healthcheck
              }}
            />
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            find out more about{' '}
            <OpensInNewTabLink
              linkHref="https://www.nhs.uk/pregnancy/keeping-well/drinking-alcohol-while-pregnant/"
              linkText="Drinking alcohol while pregnant"
              includeNewTabMessage={true}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsAlcohol,
                healthCheck: healthcheck
              }}
            />
          </DoAndDontList.Item>
        </DoAndDontList>
      </>
    );
  }
  getImportantNote(): JSX.Element {
    return <>{getImportantNoteCalloutText()}</>;
  }

  getRiskDescription(): JSX.Element {
    return (
      <>
        <p>
          Your score is {this.riskScore}. This suggests your drinking increases
          the risks to your health, including cancer, liver disease and high
          blood pressure, which can lead to a heart attack or stroke.
        </p>
        <p>
          The good news is there’s advice and support to help you cut down, and
          lots of benefits to drinking less.
        </p>
      </>
    );
  }

  getMiddleSection(): JSX.Element {
    return middleSectionInfo();
  }
}

export class AlcoholHighRiskDetails implements AlcoholPageDetails {
  readonly displayRiskLevel = AuditCategory.HighRisk;
  readonly riskLevelColor = RiskLevelColor.Red;
  readonly riskScore: number;

  constructor(riskScore: number, healthCheck?: IHealthCheck) {
    this.riskScore = riskScore;
    healthcheck = healthCheck;
  }

  getBenefitsSection(): JSX.Element {
    return (
      <>
        <h2>Benefits of cutting down</h2>
        <p>
          In the short term, if you drink less you could have more energy,
          better skin and save money.
        </p>
        <p>
          Long term, you can reduce your risk of serious illness, improve your
          mood and get better sleep.
        </p>
        <DoAndDontList listType="do" heading="Tips on cutting down">
          <DoAndDontList.Item>
            make a plan - set a limit on how much you drink and keep track of it
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            tell family and friends you’re cutting down - they can support you
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            take it a day at a time - cut back a little each day. That way,
            every day you do is a success
          </DoAndDontList.Item>
        </DoAndDontList>

        <DoAndDontList listType="do" heading="Free help and support">
          <DoAndDontList.Item>
            read the{' '}
            <OpensInNewTabLink
              linkHref="https://www.nhs.uk/live-well/alcohol-advice/tips-on-cutting-down-alcohol/"
              linkText="NHS tips on cutting down"
              includeNewTabMessage={true}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsAlcohol,
                healthCheck: healthcheck
              }}
            />
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            find out about the{' '}
            <OpensInNewTabLink
              linkHref="https://www.nhs.uk/better-health/drink-less/"
              linkText="Drink Free Days app"
              includeNewTabMessage={true}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsAlcohol,
                healthCheck: healthcheck
              }}
            />
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            find out more about{' '}
            <OpensInNewTabLink
              linkHref="https://www.nhs.uk/pregnancy/keeping-well/drinking-alcohol-while-pregnant/"
              linkText="Drinking alcohol while pregnant"
              includeNewTabMessage={true}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsAlcohol,
                healthCheck: healthcheck
              }}
            />
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            check your local authority website for alcohol support services
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            speak to your GP surgery - be honest about your drinking so they can
            give you the best help
          </DoAndDontList.Item>
        </DoAndDontList>
      </>
    );
  }

  getImportantNote(): JSX.Element {
    return <>{getImportantNoteCalloutText()}</>;
  }
  getRiskDescription(): JSX.Element {
    return (
      <>
        <p>
          Your score is {this.riskScore}. This suggests you’re at higher risk of
          alcohol-related health problems. These include cancer, liver disease
          and high blood pressure, which can lead to a heart attack or stroke.
        </p>
        <p>
          The good news is there’s advice and support to help you cut down, and
          lots of benefits to drinking less.
        </p>
      </>
    );
  }

  getMiddleSection(): JSX.Element {
    return middleSectionInfo();
  }
}

export class AlcoholDependencyDetails implements AlcoholPageDetails {
  readonly displayRiskLevel = AuditCategory.PossibleDependency;
  readonly riskLevelColor = RiskLevelColor.Red;
  readonly riskScore: number;

  constructor(riskScore: number, healthCheck?: IHealthCheck) {
    this.riskScore = riskScore;
    healthcheck = healthCheck;
  }

  getBenefitsSection(): JSX.Element {
    return <></>;
  }

  getImportantNote(): JSX.Element {
    return <>{getImportantNoteCalloutText()}</>;
  }

  getRiskDescription(): JSX.Element {
    return (
      <>
        <p>
          Your score is {this.riskScore}. This suggests you may be dependent on
          alcohol.
        </p>
        <p>
          This would put you at higher risk of health problems including cancer,
          liver disease and high blood pressure, which can lead to a heart
          attack or stroke.
        </p>
        <p>
          This kind of drinking usually affects a person&apos;s quality of life
          and relationships, but it may not be easy to see or accept this.
        </p>
        <p>
          If you are pregnant or trying to conceive, drinking could lead to
          long-term harm to the baby. The more you drink, the greater the risk.
        </p>
      </>
    );
  }

  getMiddleSection(): JSX.Element {
    return (
      <>
        <h2>Help in your area</h2>
        <p>
          If you’re finding it hard to control your drinking, or it’s having a
          negative impact on your life, there are free specialist services near
          you.
        </p>
        <p>
          Check your local authority website for alcohol support services. They
          can assess your needs, help you make a plan and give ongoing support.
        </p>
        <p>
          You can also:
          <ul className="nhsuk-u-margin-top-4">
            <li>
              check{' '}
              <OpensInNewTabLink
                linkHref="https://www.nhs.uk/live-well/alcohol-advice/alcohol-support/"
                linkText="NHS alcohol support"
                includeNewTabMessage={true}
                auditEventTriggeredOnClick={{
                  eventType: AuditEventType.ExternalResourceOpened,
                  openedFrom: OpenedFrom.ResultsAlcohol,
                  healthCheck: healthcheck
                }}
              />
            </li>
            <li>
              call{' '}
              <PhoneAnchor
                phoneNumber="0300 123 1110"
                phoneNumberForScreenReaders="zero three zero zero one two three one one one zero"
                displayText="Drinkline on 0300 123 1110"
              ></PhoneAnchor>{' '}
              for free, confidential help
            </li>
            <li>
              speak to your GP surgery - be honest about your drinking so they
              can give you the best help
            </li>
          </ul>
        </p>
      </>
    );
  }
}

function getImportantNoteCalloutText(): JSX.Element {
  return (
    <ImportantCallout>
      <p>
        Get medical advice before you stop drinking if you have physical
        withdrawal symptoms (like shaking, sweating or feeling anxious until you
        have your first drink of the day).
      </p>
      <p>
        It can be dangerous to stop drinking too quickly without proper help.
      </p>
    </ImportantCallout>
  );
}

function getChiefOfficerAdvice(): JSX.Element {
  return (
    <>
      <ul className="nhsuk-u-margin-top-4">
        <li>drink no more than 14 units a week on a regular basis</li>
        <li>
          spread your drinking over 3 or more days, if you regularly drink 14
          units or more a week
        </li>
        <li>have several drink-free days each week</li>
      </ul>
      <p>
        If you&apos;re pregnant or trying to conceive, it is recommended not to
        drink alcohol. This will keep any risk to your baby to a minimum.
      </p>
      <p>
        If you’ve already discussed alcohol with your doctor - for example if
        you have a long-term condition - follow their advice instead.
      </p>
    </>
  );
}

function renderUnitsOfAlcoholGuide() {
  return (
    <Details>
      <Details.Summary>Units of alcohol - guide</Details.Summary>
      <Details.Text>
        <p>Single shot of spirits (25ml, ABV 40%) - 1 unit</p>
        <p>
          Pint of lower-strength lager/beer/cider (568ml, ABV 3.6%) - 2 units
        </p>
        <p>Pint of strong lager/beer/cider (568ml, 5.2%) - 3 units</p>
        <p>Large glass of red/white/rosé wine (250ml, 12% ABV) - 3 units</p>
        <p>
          For explanation and more examples, read the{' '}
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/Live-well/alcohol-advice/calculating-alcohol-units/"
            linkText="NHS guidance on alcohol units."
            includeNewTabMessage={false}
            auditEventTriggeredOnClick={{
              eventType: AuditEventType.ExternalResourceOpened,
              openedFrom: OpenedFrom.ResultsAlcohol,
              healthCheck: healthcheck
            }}
          />
        </p>
      </Details.Text>
    </Details>
  );
}
function middleSectionInfo(): JSX.Element {
  return (
    <>
      <h2>How to reduce your risk</h2>
      <p>The UK Chief Medical Officers advise you to:</p>
      {getChiefOfficerAdvice()}
      {renderUnitsOfAlcoholGuide()}
    </>
  );
}
