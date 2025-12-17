import { BMICategoryDetailsPage } from './BMICategoryDetailsPage';
import { RiskLevelColor } from '../../../lib/models/RiskLevelColor';
import {
  OpenedFrom,
  OpensInNewTabLink
} from '../../../lib/components/opens-in-new-tab-link';
import { Card } from 'nhsuk-react-components';
import {
  type EthnicBackground,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';

abstract class Obese extends BMICategoryDetailsPage {
  protected healthCheck?: IHealthCheck;
  readonly riskLevelColor = RiskLevelColor.Red;

  getFreeWeightLoseServices(): JSX.Element {
    return (
      <>
        <h2>Free weight loss services </h2>
        <p>
          Visit{' '}
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/better-health/lose-weight/"
            linkText="NHS Better Health - Lose Weight"
            includeNewTabMessage={true}
            auditEventTriggeredOnClick={{
              eventType: AuditEventType.ExternalResourceOpened,
              openedFrom: OpenedFrom.ResultsBMI,
              healthCheck: this.healthCheck
            }}
          />{' '}
          for:
        </p>

        <ul className="nhsuk-u-margin-top-4">
          <li>help to find weight management services in your area</li>
          <li>
            flexible weight loss programmes, including the free NHS weight loss
            plan
          </li>
          <li>healthier eating choices</li>
        </ul>
      </>
    );
  }

  getGPSection(): JSX.Element {
    return (
      <Card cardType="non-urgent">
        <Card.Heading>Speak to your GP surgery if:</Card.Heading>
        <Card.Content>
          <ul className="nhsuk-u-margin-top-4">
            <li>you want to lose weight</li>
            <li>
              your waist size is more than half your height and you&apos;re
              concerned about this
            </li>
            <li>
              you have pre-diabetes, diabetes, high blood pressure, joint pain,
              high cholesterol or sleep apnoea
            </li>
            <li>you have a family history of obesity</li>
            <li>you have, or you think you may have, an eating disorder</li>
          </ul>

          <p>Some pharmacies can give you weight loss advice.</p>
        </Card.Content>
      </Card>
    );
  }

  getBenefitsSection(): JSX.Element {
    return (
      <>
        <h2>Benefits of working towards a healthier weight range</h2>
        <p>
          Being in a healthier weight range could reduce your risk of serious
          diseases such as high blood pressure, heart disease and type 2
          diabetes.
        </p>

        <p>
          It’s also great for your mental health and quality of life, and
          there’s tools and support to help you on the way.
        </p>
      </>
    );
  }

  getUseFulResources(): JSX.Element {
    return (
      <>
        <h2>Useful resources</h2>
        <p>All links open in new tab</p>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/healthier-families/recipes/"
            linkText="Healthy recipes - NHS Healthier Families"
            includeNewTabMessage={false}
            auditEventTriggeredOnClick={{
              eventType: AuditEventType.ExternalResourceOpened,
              openedFrom: OpenedFrom.ResultsBMI,
              healthCheck: this.healthCheck
            }}
          />
        </p>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/better-health/get-active/"
            linkText="How to be more active - NHS Better Health"
            includeNewTabMessage={false}
            auditEventTriggeredOnClick={{
              eventType: AuditEventType.ExternalResourceOpened,
              openedFrom: OpenedFrom.ResultsBMI,
              healthCheck: this.healthCheck
            }}
          />
        </p>
      </>
    );
  }
}

export class ObeseUnderSixtyFive extends Obese {
  constructor(healthCheck?: IHealthCheck) {
    super();
    this.healthCheck = healthCheck;
  }
  getPageContent(
    bmi: number,
    ethnicityBackground: EthnicBackground
  ): JSX.Element {
    const riskDescription =
      'Your BMI is in the obesity category. This suggests you are carrying too much weight and you would benefit from making some healthy changes.';
    return (
      <>
        {this.getCardDetailingBMI(bmi, ethnicityBackground, riskDescription)}
        {this.getBenefitsSection()}
        {this.getSupportToLoseWeight()}
        {this.getFreeWeightLoseServices()}
        {this.getGPSection()}
        {this.getUseFulResources()}
      </>
    );
  }

  private getSupportToLoseWeight(): JSX.Element {
    return (
      <>
        <h2>Get support to lose weight safely</h2>
        <p>
          The best way to lose weight safely is to eat a healthy reduced-calorie
          diet and exercise regularly.
        </p>

        <p>
          It’s important to find an approach that works for you. Your GP surgery
          can advise you, or you can refer yourself to some services that can
          help.
        </p>

        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/conditions/obesity/treatment/"
            linkText="Find out about treatment and support to lose weight "
            includeNewTabMessage={true}
            auditEventTriggeredOnClick={{
              eventType: AuditEventType.ExternalResourceOpened,
              openedFrom: OpenedFrom.ResultsBMI,
              healthCheck: this.healthCheck
            }}
          />
        </p>
      </>
    );
  }
}

export class ObeseSixtyFiveOrOver extends Obese {
  constructor(healthCheck?: IHealthCheck) {
    super();
    this.healthCheck = healthCheck;
  }
  getPageContent(
    bmi: number,
    ethnicityBackground: EthnicBackground
  ): JSX.Element {
    const riskDescription =
      'Your BMI is in the obesity category. This suggests you are carrying too much weight and you would benefit from making some healthy changes.';
    return (
      <>
        {this.getCardDetailingBMI(bmi, ethnicityBackground, riskDescription)}
        {this.getBenefitsSection()}
        {this.getImportantNote(
          'As you’re 65 or over, check with your GP surgery before you try to lose weight.'
        )}
        {this.getGPSection()}
        {this.getFreeWeightLoseServices()}
        {this.getUseFulResources()}
      </>
    );
  }
}
