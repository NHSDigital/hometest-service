import { ActivityCategory } from '@dnhc-health-checks/shared';
import { RiskLevelColor } from '../../../lib/models/RiskLevelColor';
import { PhysicalActivityResultsPageBase } from './PhysicalActivityResultsPageBase';

export class PhysicalActivityModeratelyActivePage extends PhysicalActivityResultsPageBase {
  readonly riskLevelDescription =
    'This means that you exercise for 1 to 3 hours each week, or your job involves standing.';

  constructor() {
    super(ActivityCategory.ModeratelyActive, RiskLevelColor.Yellow);
  }
  getMainContent(): JSX.Element {
    return (
      <>
        {this.getStayActive()}
        {this.getDos()}
      </>
    );
  }

  getStayActive(): JSX.Element {
    return (
      <>
        <h2>Stay active every day</h2>
        <p>Exercising every day can make a big difference to your health.</p>
        <p>
          Regular exercise helps you sleep better, feel less stressed, and enjoy
          life more.
        </p>
        {this.getBenefitsOfBeingActiveInset()}
        {this.getModerateVigorousActivitiesExaplanation()}
      </>
    );
  }
}
