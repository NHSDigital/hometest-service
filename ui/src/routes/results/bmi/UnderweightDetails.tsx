import { BMICategoryDetailsPage } from './BMICategoryDetailsPage';
import { RiskLevelColor } from '../../../lib/models/RiskLevelColor';
import { DoAndDontList, Card } from 'nhsuk-react-components';
import {
  type EthnicBackground,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import {
  OpenedFrom,
  OpensInNewTabLink
} from '../../../lib/components/opens-in-new-tab-link';

export class UnderweightDetails extends BMICategoryDetailsPage {
  private readonly healthCheck?: IHealthCheck;
  readonly riskLevelColor = RiskLevelColor.Yellow;
  constructor(healthCheck?: IHealthCheck) {
    super();
    this.healthCheck = healthCheck;
  }

  getPageContent(
    bmi: number,
    ethnicityBackground: EthnicBackground
  ): JSX.Element {
    const riskDescription =
      'Your BMI is in the underweight category. This suggests you could benefit from gaining weight.';

    return (
      <>
        {this.getCardDetailingBMI(bmi, ethnicityBackground, riskDescription)}
        {this.getGPSection()}
        {this.getBenefitsSection()}
        {this.getUseFulResources()}
      </>
    );
  }

  getGPSection(): JSX.Element {
    return (
      <Card cardType="non-urgent">
        <Card.Heading>Speak to your GP surgery:</Card.Heading>
        <Card.Content>
          <p>
            Book an appointment with your GP surgery to discuss your BMI result,
            if you&apos;ve not already discussed your weight with them.
          </p>
        </Card.Content>
      </Card>
    );
  }
  getBenefitsSection(): JSX.Element {
    return (
      <>
        <h2>Benefits of gaining weight</h2>
        <p>
          Working towards a healthier weight range could boost your energy
          levels, making it easier to stay active and enjoy daily activities,
          like walking or shopping.
        </p>

        <DoAndDontList listType="do" heading="Healthy ways to gain weight">
          <DoAndDontList.Item>
            gain weight gradually by increasing your calorie intake. Adults
            could try adding around 300 to 500 extra calories a day from healthy
            foods
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            eat smaller meals more often, adding healthy snacks between meals
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            choose healthy calorie-dense foods to add to meals, such as peanut
            butter, olive oil and seeds
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            build muscle with strength training or yoga - exercise can also
            improve your appetite
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
            linkHref="https://www.nhs.uk/live-well/healthy-weight/managing-your-weight/healthy-ways-to-gain-weight/"
            linkText="Healthy ways to gain weight - NHS website"
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
