export interface IRiskScores {
  qRiskScore: number;
  qRiskScoreCategory: QRiskCategory;
  scoreCalculationDate: string;
  heartAge?: number;
}

export enum QRiskCategory {
  Low = 'Low',
  Moderate = 'Moderate',
  High = 'High'
}
