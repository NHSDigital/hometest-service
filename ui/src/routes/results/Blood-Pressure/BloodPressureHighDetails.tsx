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
import { PhoneAnchor } from '../../../lib/components/phone-anchor';

export class BloodPressureHighDetails implements BloodPressurePageDetails {
  private readonly healthCheck?: IHealthCheck;
  constructor(
    readonly bloodPressureLocation: BloodPressureLocation,
    healthCheck?: IHealthCheck
  ) {
    this.healthCheck = healthCheck;
  }

  readonly displayBloodPressureResultColor = BloodPressureCategory.High;
  readonly BloodPressureResultColor = RiskLevelColor.Red;
  getPageContent(): JSX.Element {
    return this.bloodPressureLocation === BloodPressureLocation.Pharmacy
      ? this.getPharmacyPageContent()
      : this.getHomePageContent();
  }
  getHomePageContent() {
    return (
      <>
        {this.speakToGP()}
        {this.call111()}
        {this.lowerBloodPressure()}
      </>
    );
  }
  getPharmacyPageContent() {
    return (
      <>
        {this.followAdvice()}
        {this.call111()}
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
          If you lowered your blood pressure to a healthy level, your heart age
          could improve.
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
    return (
      <p>
        This is high blood pressure. It can increase your risk of serious
        problems like heart attacks and strokes.
      </p>
    );
  }

  followAdvice(): JSX.Element {
    return (
      <>
        <h2>Follow the advice the healthcare professional gave you</h2>
        <p>
          Follow the advice given to you by the healthcare professional who took
          your blood pressure reading.
        </p>
      </>
    );
  }
  speakToGP(): JSX.Element {
    return (
      <Card cardType="non-urgent">
        <Card.Heading>Get tested at a GP surgery or pharmacy</Card.Heading>
        <Card.Content>
          <p>
            Speak to your GP surgery or pharmacy within 2 working days to book a
            blood pressure appointment.
          </p>
          <p>Tell them your blood pressure reading and that it’s high.</p>
        </Card.Content>
      </Card>
    );
  }
  call111(): JSX.Element {
    return (
      <Card cardType="urgent">
        <Card.Heading aria-label="Urgent advice. Call one one one if:">
          Call 111 if:
        </Card.Heading>
        <Card.Content>
          <ul>
            <li>you start to feel unwell</li>
          </ul>
          <p>
            <PhoneAnchor
              phoneNumber="111"
              phoneNumberForScreenReaders="one one one"
              displayText="Call 111"
            ></PhoneAnchor>
          </p>
          <p>
            Or get advice on the{' '}
            <OpensInNewTabLink
              linkHref="https://111.nhs.uk"
              linkText="111 website"
              includeNewTabMessage={true}
              auditEventTriggeredOnClick={{
                eventType: AuditEventType.ExternalResourceOpened,
                openedFrom: OpenedFrom.ResultsBloodPressure,
                healthCheck: this.healthCheck
              }}
            />
          </p>
        </Card.Content>
      </Card>
    );
  }
}
