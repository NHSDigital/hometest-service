import { type SmokingCategory } from '@dnhc-health-checks/shared';
export interface SmokingPageDetails {
  displaySmokingResultColor: SmokingCategory;
  SmokingResultColor: SmokingResultColor;
  getMiddleSection: () => JSX.Element;
  getBenefitsSection: () => JSX.Element;
  getRiskDescription: () => JSX.Element;
  getImportantNote: () => JSX.Element;
  getPageContent: () => JSX.Element;
}
export enum SmokingResultColor {
  Green = 'app-card--green',
  Yellow = 'app-card--yellow',
  Red = 'app-card--red',
  Blue = 'app-card--blue'
}
