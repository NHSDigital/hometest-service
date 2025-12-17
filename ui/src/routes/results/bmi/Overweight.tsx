import { BMICategoryDetailsPage } from './BMICategoryDetailsPage';
import { RiskLevelColor } from '../../../lib/models/RiskLevelColor';
import {
  OpenedFrom,
  OpensInNewTabLink
} from '../../../lib/components/opens-in-new-tab-link';
import { DoAndDontList, Card } from 'nhsuk-react-components';
import {
  type EthnicBackground,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';

abstract class Overweight extends BMICategoryDetailsPage {
  protected healthCheck?: IHealthCheck;
  readonly riskLevelColor = RiskLevelColor.Yellow;
  constructor(healthCheck?: IHealthCheck) {
    super();
    this.healthCheck = healthCheck;
  }
  getToolsAndSupportSection(): JSX.Element {
    return (
      <>
        <h2>Free tools and support</h2>

        <p>
          Visit{' '}
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/better-health/lose-weight/"
            linkText="NHS Better Health - Lose weight"
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
            <li>you have, or you think you may have, an eating disorder</li>
          </ul>
          <p>Some pharmacies can give you weight loss advice.</p>
        </Card.Content>
      </Card>
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

export class OverweightUnderSixtyFive extends Overweight {
  constructor(healthCheck?: IHealthCheck) {
    super();
    this.healthCheck = healthCheck;
  }
  getPageContent(
    bmi: number,
    ethnicityBackground: EthnicBackground
  ): JSX.Element {
    const riskDescription =
      'Your BMI is in the overweight category. This suggests you could benefit from making some healthy changes.';
    return (
      <>
        {this.getCardDetailingBMI(bmi, ethnicityBackground, riskDescription)}
        {this.getBenefitsSection()}
        {this.getToolsAndSupportSection()}
        {this.getGPSection()}
        {this.getUseFulResources()}
      </>
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
          It’s important to find an approach that works for you. Small changes
          to your activity and diet can make a big difference, for your body and
          mind.
        </p>

        <DoAndDontList listType="do" heading="Tips to help you lose weight:">
          <DoAndDontList.Item>
            check the labels – use the ’traffic light labels’ on the packet to
            help you choose healthier options. Cut down on reds and go for more
            greens and ambers
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            eat the right portion size, try using smaller plates and bowls
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            swap sugary drinks for water, sugar-free drinks or lower-fat milks
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            <OpensInNewTabLink
              linkHref="https://www.nhs.uk/better-health/lose-weight/healthy-eating-when-trying-to-lose-weight/"
              linkText="Healthy eating when trying to lose weight - NHS Better Health"
              includeNewTabMessage={true}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsBMI,
                healthCheck: this.healthCheck
              }}
            />
          </DoAndDontList.Item>
        </DoAndDontList>
      </>
    );
  }
}

export class OverweightSixtyFiveOrOver extends Overweight {
  constructor(healthCheck?: IHealthCheck) {
    super();
    this.healthCheck = healthCheck;
  }
  getPageContent(
    bmi: number,
    ethnicityBackground: EthnicBackground
  ): JSX.Element {
    const riskDescription =
      'Your BMI is in the overweight category. This suggests you could benefit from making some healthy changes.';
    return (
      <>
        {this.getCardDetailingBMI(bmi, ethnicityBackground, riskDescription)}
        {this.getBenefitsSection()}
        {this.getImportantNote(
          'As you’re 65 or over, check with your GP surgery before you try to lose weight.'
        )}
        {this.getGPSection()}
        {this.getToolsAndSupportSection()}
        {this.getUseFulResources()}
      </>
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
      </>
    );
  }
}
