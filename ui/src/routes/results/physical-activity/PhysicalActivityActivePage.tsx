import { ActivityCategory } from '@dnhc-health-checks/shared';
import { RiskLevelColor } from '../../../lib/models/RiskLevelColor';
import { PhysicalActivityResultsPageBase } from './PhysicalActivityResultsPageBase';

export class PhysicalActivityActivePage extends PhysicalActivityResultsPageBase {
  readonly riskLevelDescription =
    'This means that you exercise for more than 3 hours a week, or your job involves physical effort and handling of heavy objects or tools.';
  constructor() {
    super(ActivityCategory.Active, RiskLevelColor.Green);
  }

  getMainContent(): JSX.Element {
    return (
      <>
        {this.getBenefitsOfBeingActive()}
        {this.getDos()}
      </>
    );
  }

  getBenefitsOfBeingActive(): JSX.Element {
    return (
      <>
        <h2>Benefits of being active</h2>
        <p>
          By being active, you’ve made a great choice for your health. You’ll
          sleep better, feel less stressed and enjoy life more.
        </p>
        {this.getBenefitsOfBeingActiveInset()}
        {this.getModerateVigorousActivitiesExaplanation()}
      </>
    );
  }
}
