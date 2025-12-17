import { Card, DoAndDontList } from 'nhsuk-react-components';
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
import { PhoneAnchor } from '../../../lib/components/phone-anchor';
import { RiskLevelColor } from '../../../lib/models/RiskLevelColor';

export class BloodPressureLowNoFaintingDetails
  implements BloodPressurePageDetails
{
  private readonly healthCheck?: IHealthCheck;
  constructor(
    readonly bloodPressureLocation: BloodPressureLocation,
    healthCheck?: IHealthCheck
  ) {
    this.healthCheck = healthCheck;
  }

  readonly displayBloodPressureResultColor = BloodPressureCategory.Low;
  readonly BloodPressureResultColor = RiskLevelColor.Purple;

  getPageContent(): JSX.Element {
    return this.bloodPressureLocation === BloodPressureLocation.Pharmacy
      ? this.getPharmacyPageContent()
      : this.getHomePageContent();
  }
  getHomePageContent() {
    return (
      <>
        {this.getChecked()}
        {this.call111()}
        {this.helpLowSymptoms()}
      </>
    );
  }
  getPharmacyPageContent() {
    return (
      <>
        {this.followAdvice()}
        {this.call111()}
        {this.helpLowSymptoms()}
      </>
    );
  }
  helpLowSymptoms(): JSX.Element {
    return (
      <>
        <h2>Things you can do to help with low blood pressure symptoms</h2>
        <DoAndDontList listType="do">
          <DoAndDontList.Item>
            get up slowly from lying to sitting to standing
          </DoAndDontList.Item>
          <DoAndDontList.Item>eat small, frequent meals</DoAndDontList.Item>
          <DoAndDontList.Item>
            increase the amount of water you drink
          </DoAndDontList.Item>
          <DoAndDontList.Item>
            ask your doctor to review your medicines
          </DoAndDontList.Item>
        </DoAndDontList>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/conditions/low-blood-pressure-hypotension"
            linkText="Read NHS guidance about low blood pressure"
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
        Your blood pressure reading is low. That’s usually not a problem, as it
        can be naturally low for some people. But sometimes it can be caused by
        illness, a health condition or some medicines.
      </p>
    );
  }
  getChecked(): JSX.Element {
    return (
      <>
        <h2>Continue to check your blood pressure</h2>
        <p>
          If you feel well, check your blood pressure at home in 1 year. You
          should also have your blood pressure checked at a GP surgery or
          pharmacy at least once every 5 years.
        </p>
        <p>
          If you’re having symptoms, check your blood pressure every month or as
          often as your doctor advises.
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
          If you’re overweight, smoke or are over 65, you should check your
          blood pressure more frequently and come back to this tool to get
          advice on what to do next.
        </p>
      </>
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
            <li>
              you have symptoms of fainting or dizziness. For example, passing
              out for short periods of time, feeling lightheaded or off-balance.
            </li>
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
