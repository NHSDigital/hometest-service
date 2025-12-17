import { type BloodPressureCategory } from '@dnhc-health-checks/shared';
import { type RiskLevelColor } from '../../../lib/models/RiskLevelColor';

export interface BloodPressurePageDetails {
  displayBloodPressureResultColor: BloodPressureCategory;
  BloodPressureResultColor: RiskLevelColor;
  getRiskDescription: () => JSX.Element;
  getPageContent: () => JSX.Element;
  followAdvice: () => JSX.Element;
}
