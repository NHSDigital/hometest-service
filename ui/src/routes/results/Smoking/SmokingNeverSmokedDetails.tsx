import { DoAndDontList } from 'nhsuk-react-components';
import {
  type IHealthCheck,
  SmokingCategory,
  AuditEventType
} from '@dnhc-health-checks/shared';
import { type SmokingPageDetails, SmokingResultColor } from './SmokingBase';
import {
  OpenedFrom,
  OpensInNewTabLink
} from '../../../lib/components/opens-in-new-tab-link';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

export class SmokingNeverSmokedDetails implements SmokingPageDetails {
  private readonly healthCheck?: IHealthCheck;
  readonly displaySmokingResultColor = SmokingCategory.NeverSmoked;
  readonly SmokingResultColor = SmokingResultColor.Green;
  constructor(healthCheck?: IHealthCheck) {
    this.healthCheck = healthCheck;
  }
  getPageContent(): JSX.Element {
    return (
      <>
        {this.getMiddleSection()}
        {this.getBenefitsSection()}
        {this.getImportantNote()}
      </>
    );
  }
  getImportantNote(): JSX.Element {
    return (
      <>
        <h2>Useful resources</h2>
        <p>The following links open in a new tab.</p>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/better-health/quit-smoking/"
            linkText="NHS guidance on smoking"
            includeNewTabMessage={false}
            auditEventTriggeredOnClick={{
              eventType: AuditEventType.ExternalResourceOpened,
              openedFrom: OpenedFrom.ResultsSmoking,
              healthCheck: this.healthCheck
            }}
          />
        </p>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/better-health/quit-smoking/vaping-to-quit-smoking/"
            linkText="NHS guidance on vaping"
            includeNewTabMessage={false}
            auditEventTriggeredOnClick={{
              eventType: AuditEventType.ExternalResourceOpened,
              openedFrom: OpenedFrom.ResultsSmoking,
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
        This lowers your risk of cancer, lung disease, heart disease, stroke and
        dementia.
      </p>
    );
  }
  getBenefitsSection(): JSX.Element {
    return (
      <DoAndDontList listType="do" heading="By not smoking you:">
        <DoAndDontList.Item>
          lower your risk of cancer, lung disease, heart disease, stroke and
          dementia
        </DoAndDontList.Item>
        <DoAndDontList.Item>
          protect your loved ones and pets from secondhand smoke
        </DoAndDontList.Item>
        <DoAndDontList.Item>
          prevent any damage to your skin and teeth that smoking can cause
        </DoAndDontList.Item>
        <DoAndDontList.Item>
          save money - the average smoker spends around £38 a week on cigarettes
        </DoAndDontList.Item>
      </DoAndDontList>
    );
  }
  getMiddleSection(): JSX.Element {
    return (
      <>
        <h2>A great choice for your health</h2>
        <p>
          Choosing not to smoke is a great way to protect your health and enjoy
          a better quality of life.
        </p>
      </>
    );
  }
  headingMessage(): string {
    return EnumDescriptions.Smoking.Never.heading;
  }
}
