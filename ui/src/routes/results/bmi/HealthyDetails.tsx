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

export class HealthyDetails extends BMICategoryDetailsPage {
  private readonly healthCheck?: IHealthCheck;
  constructor(healthCheck?: IHealthCheck) {
    super();
    this.healthCheck = healthCheck;
  }
  readonly riskLevelColor = RiskLevelColor.Green;

  getPageContent(
    bmi: number,
    ethnicityBackground: EthnicBackground
  ): JSX.Element {
    const riskDescription = 'Your BMI is in the healthy weight category.';
    return (
      <>
        {this.getCardDetailingBMI(bmi, ethnicityBackground, riskDescription)}
        {this.getBenefitsSection()}
        {this.getGPSection()}
        {this.getUseFulResources()}
      </>
    );
  }

  getGPSection(): JSX.Element {
    return (
      <Card cardType="non-urgent">
        <Card.Heading>Speak to your GP surgery if:</Card.Heading>
        <Card.Content>
          <ul className="nhsuk-u-margin-top-4">
            <li>you&apos;re concerned about your weight</li>
            <li>
              your waist size is more than half your height and you&apos;re
              concerned about this
            </li>
            <li>you have, or you think you may have, an eating disorder</li>
          </ul>
        </Card.Content>
      </Card>
    );
  }

  getBenefitsSection(): JSX.Element {
    return (
      <>
        <h2>Benefits of being a healthy weight</h2>
        <p>
          Staying at a healthy weight can help to reduce the risk of serious
          diseases such as high blood pressure, heart disease and type 2
          diabetes. It’s also great for your mental health and quality of life.
        </p>

        <DoAndDontList listType="do" heading="To maintain a healthy weight:">
          <DoAndDontList.Item>
            check the labels – use the ’traffic light labels’ on the packet to
            help you choose healthier options. Cut down on reds and go for more
            greens and ambers
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            move as much as possible - aim for 150 minutes of moderate intensity
            activity a week, such as brisk walking or cycling
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            swap sugary drinks for water, sugar-free drinks or lower-fat milks
          </DoAndDontList.Item>
        </DoAndDontList>
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
