import { Card, DoAndDontList, InsetText } from 'nhsuk-react-components';
import { RiskLevelColor } from '../../../lib/models/RiskLevelColor';
import { type IHealthCheck, AuditEventType } from '@dnhc-health-checks/shared';
import { ImportantCallout } from '../../../lib/components/important-callout';
import { PhoneAnchor } from '../../../lib/components/phone-anchor';
import {
  OpensInNewTabLink,
  OpenedFrom
} from '../../../lib/components/opens-in-new-tab-link';

let healthcheck: IHealthCheck | undefined;

export interface DiabetesPageDetails {
  displayRiskLevel: string;
  riskLevelColor: RiskLevelColor;
  getRiskDescription: () => JSX.Element;
  getAdviceSection: () => JSX.Element;
  getGPSection: () => JSX.Element;
  getUseFulResources: () => JSX.Element;
}

export class DiabetesHighRiskDetails implements DiabetesPageDetails {
  readonly displayRiskLevel = 'Possible diabetes';
  readonly riskLevelColor = RiskLevelColor.Red;
  readonly riskScore: number;

  constructor(riskScore: number, healthCheck?: IHealthCheck) {
    this.riskScore = riskScore;
    healthcheck = healthCheck;
  }

  getRiskDescription(): JSX.Element {
    return (
      <>
        <InsetText
          className={
            this.riskLevelColor +
            ' nhsuk-u-margin-top-5 nhsuk-u-margin-bottom-5'
          }
        >
          <p>
            Your HbA1c blood test result is {this.riskScore} mmol/mol. This
            suggests possible type 2 diabetes.
          </p>
        </InsetText>
        <p>This reading is just a guide, not a diagnosis.</p>
      </>
    );
  }

  getAdviceSection(): JSX.Element {
    return (
      <>
        <Card cardType="urgent">
          <Card.Heading>Contact your GP surgery</Card.Heading>
          <Card.Content>
            <p>
              Contact your GP surgery to discuss your result within the next 24
              hours. They will make a diagnosis, and help you understand what to
              do next.
            </p>
            <p>
              If your result is 86 mmol/mol or over and you cannot get an
              appointment today,{' '}
              <PhoneAnchor
                phoneNumber="111"
                phoneNumberForScreenReaders="one one one"
                displayText="call 111"
              />
              .
            </p>
          </Card.Content>
        </Card>
        <Card cardType="emergency">
          <Card.Heading aria-label="Immediate action required: Call nine nine nine or go to A&E now if">
            Call 999 or go to A&E now if:
          </Card.Heading>
          <Card.Content>
            <ul>
              <li>you’re feeling sick, being sick or have stomach pain</li>
              <li>
                you’re breathing more quickly than usual or your heart is
                beating faster than usual
              </li>
              <li>you are struggling to stay awake or feel drowsy</li>
              <li>your breath has a fruity smell (like pear drop sweets)</li>
              <li>you feel confused or have difficulty concentrating</li>
              <li>you’re feeling thirsty and needing to pee more often</li>
            </ul>
            <p>
              <PhoneAnchor
                phoneNumber="999"
                phoneNumberForScreenReaders="nine nine nine"
                displayText="Call 999"
              />
            </p>
            <p>
              {getExternalDiabetesResource(
                'https://www.nhs.uk/service-search/find-an-accident-and-emergency-service/',
                'Find your nearest A&E',
                healthcheck
              )}
            </p>
          </Card.Content>
        </Card>

        <DiabetesExplained />

        <HowToManageRisk />

        <LifestyleAdvice />
      </>
    );
  }

  getGPSection(): JSX.Element {
    return <></>;
  }
  getUseFulResources(): JSX.Element {
    return <UsefulResources />;
  }
}

export class DiabetesAtRiskDetails implements DiabetesPageDetails {
  readonly displayRiskLevel = 'High';
  readonly riskLevelColor = RiskLevelColor.Red;
  readonly riskScore: number;

  constructor(riskScore: number, healthCheck?: IHealthCheck) {
    this.riskScore = riskScore;
    healthcheck = healthCheck;
  }

  getRiskDescription(): JSX.Element {
    return (
      <>
        <InsetText
          className={
            this.riskLevelColor +
            ' nhsuk-u-margin-top-5 nhsuk-u-margin-bottom-5'
          }
        >
          <p>
            Your HbA1c blood test result is {this.riskScore} mmol/mol. This
            suggests you’re at high risk of developing type 2 diabetes - this is
            known as prediabetes.
          </p>
        </InsetText>
        <p>This reading is just a guide, not a diagnosis.</p>
      </>
    );
  }
  getAdviceSection(): JSX.Element {
    return (
      <>
        <Card cardType="urgent">
          <Card.Heading>Contact your GP surgery</Card.Heading>
          <Card.Content>
            <p>
              Make an appointment at your GP surgery to discuss your result.
              They’ll give you a diagnosis, and help you understand what to do
              next. They’ll also follow up with you every year.
            </p>
            <p>
              Contact your GP surgery urgently if you experience any of the
              following symptoms:
            </p>
            <SymptomsList />
          </Card.Content>
        </Card>

        <DiabetesExplained prediabetes={true} />
        <HowToManageRisk />
        <LifestyleAdvice />
      </>
    );
  }

  getGPSection(): JSX.Element {
    return <></>;
  }

  getUseFulResources(): JSX.Element {
    return <UsefulResources />;
  }
}

export class DiabetesLowRiskDetails implements DiabetesPageDetails {
  readonly displayRiskLevel = 'Moderate';
  readonly riskLevelColor = RiskLevelColor.Yellow;
  readonly riskScore: number;

  constructor(riskScore: number, healthCheck?: IHealthCheck) {
    this.riskScore = riskScore;
    healthcheck = healthCheck;
  }

  getRiskDescription(): JSX.Element {
    return (
      <>
        <InsetText
          className={
            this.riskLevelColor +
            ' nhsuk-u-margin-top-5 nhsuk-u-margin-bottom-5'
          }
        >
          <p>
            Your HbA1c blood test result is in the normal range (
            {this.riskScore} mmol/mol).
          </p>
          <p>
            However, other risk factors suggest you’re at moderate risk of
            developing type 2 diabetes.
          </p>
        </InsetText>
        <p>This reading is just a guide, not a diagnosis.</p>
      </>
    );
  }

  getAdviceSection(): JSX.Element {
    return (
      <>
        <RiskIncreaseCallout />
        <DiabetesExplained />
        <HowToManageRisk />
        <LifestyleAdvice />
      </>
    );
  }

  getGPSection(): JSX.Element {
    return <GPSectionInfo />;
  }

  getUseFulResources(): JSX.Element {
    return <UsefulResources />;
  }
}

export class DiabetesLowLeicesterRiskDetails implements DiabetesPageDetails {
  readonly displayRiskLevel = 'Low';
  readonly riskLevelColor = RiskLevelColor.Green;
  constructor(healthCheck?: IHealthCheck) {
    healthcheck = healthCheck;
  }

  getRiskDescription(): JSX.Element {
    return (
      <>
        <InsetText
          className={
            this.riskLevelColor +
            ' nhsuk-u-margin-top-5 nhsuk-u-margin-bottom-5'
          }
        >
          <p>You’re at low risk of developing type 2 diabetes.</p>
        </InsetText>
        <p>This reading is just a guide, not a diagnosis.</p>
      </>
    );
  }

  getAdviceSection(): JSX.Element {
    return (
      <>
        <RiskIncreaseCallout />

        <h2>Stay active and eat well</h2>
        <p>
          Based on what you’ve told us, you’re making healthy choices that put
          you at a low risk of developing type 2 diabetes.
        </p>
        <p>
          Your risk does depend on some things you cannot change like family
          history, age and ethnicity.
        </p>
        <p>
          But maintaining a healthy lifestyle can help keep your risk of type 2
          diabetes low, which means less risk of a heart attack or stroke.
        </p>

        <LifestyleAdvice lowRiskNoBloodTest={true} />
      </>
    );
  }

  getGPSection(): JSX.Element {
    return <GPSectionInfo />;
  }

  getUseFulResources(): JSX.Element {
    return <UsefulResources />;
  }
}

const RiskIncreaseCallout: React.FC = () => (
  <ImportantCallout>
    <p>
      Your risk could increase in future. Ask your GP surgery to check your risk
      of diabetes every 3 years.
    </p>
  </ImportantCallout>
);

const DiabetesExplained: React.FC<{ prediabetes?: boolean }> = ({
  prediabetes = false
}) => (
  <>
    <h2>Type 2 diabetes explained</h2>
    <p>
      Type 2 diabetes is a common condition where the level of sugar (glucose)
      in your blood is too high.
    </p>
    <p>
      Over time this could cause a heart attack or stroke, as well as other
      health problems, but there’s lots you can do to manage the risk.
    </p>
    <p>
      {prediabetes
        ? getExternalDiabetesResource(
            'https://www.diabetes.org.uk/about-diabetes/type-2-diabetes/prediabetes',
            'Prediabetes - Diabetes UK',
            healthcheck
          )
        : getExternalDiabetesResource(
            'https://www.nhs.uk/conditions/diabetes/',
            'Diabetes - nhs.uk',
            healthcheck
          )}
    </p>
  </>
);

const HowToManageRisk: React.FC = () => (
  <>
    <h2>How to manage your risk</h2>
    <p>
      Your risk of type 2 diabetes depends on a few things that cannot change,
      like your family history, age, and ethnicity.{' '}
    </p>
    <p>
      But you can lower your risk through eating well, moving more and losing
      weight if you need to. And there’s plenty of support and advice to help.
    </p>
  </>
);

const GPSectionInfo: React.FC = () => {
  return (
    <Card cardType="non-urgent">
      <Card.Heading>Contact your GP surgery if:</Card.Heading>
      <Card.Content>
        <GPAdviceList />
      </Card.Content>
    </Card>
  );
};

const UsefulResources: React.FC = () => (
  <>
    <h2>Useful resources</h2>
    <p>The following links open in a new tab.</p>

    <p>
      {getExternalDiabetesResource(
        'https://www.diabetes.org.uk/about-diabetes/type-2-diabetes/can-diabetes-be-prevented',
        'Reduce your risk of type 2 diabetes - Diabetes UK',
        healthcheck,
        false
      )}
    </p>
    <p>
      {getExternalDiabetesResource(
        'https://www.diabetes.org.uk/about-diabetes/type-2-diabetes/diabetes-risk-factors',
        'Type 2 diabetes risk factors - Diabetes UK',
        healthcheck,
        false
      )}
    </p>
    <p>
      {getExternalDiabetesResource(
        'https://www.nhs.uk/conditions/diabetes/',
        'Diabetes - nhs.uk',
        healthcheck,
        false
      )}
    </p>
  </>
);

const GPAdviceList: React.FC = () => (
  <>
    <p>You experience any of the following symptoms:</p>
    <SymptomsList />
  </>
);

const SymptomsList: React.FC = () => (
  <ul className="nhsuk-u-margin-top-4">
    <li>peeing more than usual</li>
    <li>feeling thirsty all the time</li>
    <li>feeling very tired</li>
    <li>losing weight without trying to</li>
    <li>itching around your penis or vagina, or repeatedly getting thrush</li>
    <li>cuts or wounds taking longer to heal</li>
    <li>blurred vision</li>
  </ul>
);

const LifestyleAdvice: React.FC<{ lowRiskNoBloodTest?: boolean }> = ({
  lowRiskNoBloodTest = false
}) => (
  <DoAndDontList
    listType="do"
    heading={`Tips to ${lowRiskNoBloodTest ? 'keep your risk low' : 'lower your risk'}`}
  >
    <DoAndDontList.Item>
      eat well - get plenty of fruit, vegetables and high fibre carbohydrates
      like chickpeas, and cut down on salt and sugary drinks
    </DoAndDontList.Item>
    <DoAndDontList.Item>
      move more - aim for 150 minutes of moderate intensity activity a week,
      such as brisk walking or cycling
    </DoAndDontList.Item>
    <DoAndDontList.Item>
      sit less - break up long periods of sitting time with at least light
      activity
    </DoAndDontList.Item>
    <DoAndDontList.Item>
      get support to lose weight if you need to -{' '}
      {getExternalDiabetesResource(
        'https://www.diabetes.org.uk/diabetes-the-basics/types-of-diabetes/type-2/preventing',
        'Diabetes UK',
        healthcheck
      )}{' '}
      has advice, or your GP surgery can help you find local services
    </DoAndDontList.Item>
  </DoAndDontList>
);

export function getExternalDiabetesResource(
  linkHref: string,
  linkText: string,
  healthCheck?: IHealthCheck,
  includeNewTabMessage: boolean = true
) {
  return (
    <OpensInNewTabLink
      linkHref={linkHref}
      linkText={linkText}
      includeNewTabMessage={includeNewTabMessage}
      auditEventTriggeredOnClick={{
        eventType: AuditEventType.ExternalResourceOpened,
        openedFrom: OpenedFrom.ResultsDiabetes,
        healthCheck: healthCheck
      }}
    />
  );
}
