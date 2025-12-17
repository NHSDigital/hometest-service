import { Card } from 'nhsuk-react-components';
import {
  BloodPressureCategory,
  type IHealthCheck,
  BloodPressureLocation,
  AuditEventType
} from '@dnhc-health-checks/shared';
import { type BloodPressurePageDetails } from './BloodPressureBase';
import {
  OpenedFrom,
  OpensInNewTabLink
} from '../../../lib/components/opens-in-new-tab-link';
import { RiskLevelColor } from '../../../lib/models/RiskLevelColor';

export class BloodPressureSlightlyRaisedDetails
  implements BloodPressurePageDetails
{
  private readonly healthCheck?: IHealthCheck;
  constructor(
    readonly bloodPressureLocation: BloodPressureLocation,
    healthCheck?: IHealthCheck
  ) {
    this.healthCheck = healthCheck;
  }

  readonly displayBloodPressureResultColor =
    BloodPressureCategory.SlightlyRaised;
  readonly BloodPressureResultColor = RiskLevelColor.Yellow;
  getPageContent(): JSX.Element {
    return this.bloodPressureLocation === BloodPressureLocation.Pharmacy
      ? this.getPharmacyPageContent()
      : this.getHomePageContent();
  }
  getHomePageContent() {
    return (
      <>
        {this.getChecked()}
        {this.speakToGP()}
        {this.lowerBloodPressure()}
      </>
    );
  }
  getPharmacyPageContent() {
    return (
      <>
        {this.followAdvice()}
        {this.lowerBloodPressure()}
      </>
    );
  }

  lowerBloodPressure(): JSX.Element {
    return (
      <>
        <h2>Lowering your blood pressure</h2>
        <p>
          A healthy blood pressure should be any reading between 90/60 and
          120/80.
        </p>
        <p>
          Making changes to your lifestyle, like eating healthily and exercising
          more, can have a positive effect on your blood pressure.
        </p>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/conditions/high-blood-pressure-hypertension/treatment/"
            linkText="Read NHS guidance about high blood pressure"
            includeNewTabMessage={true}
            auditEventTriggeredOnClick={{
              eventType: AuditEventType.ExternalResourceOpened,
              openedFrom: OpenedFrom.ResultsBloodPressure,
              healthCheck: this.healthCheck
            }}
          />
        </p>
      </>
    );
  }
  getRiskDescription(): JSX.Element {
    return <p>Your blood pressure reading is slightly raised.</p>;
  }
  getChecked(): JSX.Element {
    return (
      <>
        <h2>Take another reading in 1 month</h2>
        <p>
          You should then continue to check your blood pressure every few
          months.
        </p>
        <p>
          If your blood pressure increases to 135/85 or more, visit a GP surgery
          or pharmacy to have your blood pressure checked by a healthcare
          professional.
        </p>
      </>
    );
  }
  followAdvice(): JSX.Element {
    return (
      <>
        <h2>Follow the advice the healthcare professional gave you</h2>
        <p>
          You should also check your blood pressure at a GP surgery or pharmacy
          at least once every 5 years.
        </p>
        <p>
          If you start to feel unwell, get your blood pressure checked at a GP
          surgery or pharmacy sooner.
        </p>
        <p>
          If you’re overweight, smoke or are over 65, you should check your
          blood pressure more frequently and come back to this tool to get
          advice on what to do next.
        </p>
      </>
    );
  }
  speakToGP(): JSX.Element {
    return (
      <Card cardType="non-urgent">
        <Card.Heading>Speak to your GP or pharmacy if: </Card.Heading>
        <Card.Content>
          <ul>
            <li>your blood pressure increases to 135/85 or more</li>
          </ul>
          <p>
            If this happens, get your blood pressure checked by a healthcare
            professional.
          </p>
        </Card.Content>
      </Card>
    );
  }
}
