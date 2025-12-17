import { DoAndDontList } from 'nhsuk-react-components';
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

export class BloodPressureHealthyDetails implements BloodPressurePageDetails {
  private readonly healthCheck?: IHealthCheck;
  constructor(
    readonly bloodPressureLocation: BloodPressureLocation,
    healthCheck?: IHealthCheck
  ) {
    this.healthCheck = healthCheck;
  }

  readonly displayBloodPressureResultColor = BloodPressureCategory.Healthy;
  readonly BloodPressureResultColor = RiskLevelColor.Green;

  getPageContent(): JSX.Element {
    return this.bloodPressureLocation === BloodPressureLocation.Pharmacy
      ? this.getPharmacyPageContent()
      : this.getHomePageContent();
  }
  getHomePageContent() {
    return (
      <>
        {this.getChecked()}
        {this.preventHighBloodPressure()}
      </>
    );
  }
  getPharmacyPageContent() {
    return (
      <>
        {this.followAdvice()}
        {this.preventHighBloodPressure()}
      </>
    );
  }

  preventHighBloodPressure(): JSX.Element {
    return (
      <>
        <h2>How to help prevent high blood pressure</h2>
        <DoAndDontList listType="do">
          <DoAndDontList.Item>
            reduce the amount of salt in your diet
          </DoAndDontList.Item>
          <DoAndDontList.Item>cut back on alcohol</DoAndDontList.Item>
          <DoAndDontList.Item>try to follow a healthy diet</DoAndDontList.Item>
          <DoAndDontList.Item>
            try to lose some weight if you’re overweight
          </DoAndDontList.Item>
          <DoAndDontList.Item>exercise regularly</DoAndDontList.Item>
          <DoAndDontList.Item>limit your caffeine intake</DoAndDontList.Item>
          <DoAndDontList.Item>
            try to cut down or quit smoking if you smoke
          </DoAndDontList.Item>
        </DoAndDontList>
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
    return <p>Your blood pressure reading is healthy.</p>;
  }
  getChecked(): JSX.Element {
    return (
      <>
        <h2>Get your blood pressure checked in 5 years</h2>
        <p>
          If you feel well and do not have any symptoms, check your blood
          pressure at a GP surgery or pharmacy at least once every 5 years.
        </p>
        <p>
          If you’ve been advised to check more often by a healthcare
          professional, then follow their advice.
        </p>
        <p>
          Getting a blood pressure monitor means you can take your readings more
          frequently.
        </p>
        <p>
          If you’re at risk of high blood pressure, for example, if you’re
          overweight, smoke or are over 65, you should check your blood pressure
          more frequently.
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
}
