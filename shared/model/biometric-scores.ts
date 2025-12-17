import type {
  OverallDiabetesCategory,
  DiabetesCategory,
  OverallCholesterolCategory,
  TotalCholesterolCategory,
  HdlCholesterolCategory,
  TotalCholesterolHdlRatioCategory
} from './enum/score-categories';

export interface IBiometricScores {
  date: string;
  scores: IScores;
}

export interface IScores {
  cholesterol?: ICholesterolScore;
  diabetes?: IDiabetesScore;
}

export interface IDiabetesScore {
  overallCategory: OverallDiabetesCategory;
  hba1c?: number | null;
  category?: DiabetesCategory;
  failureReason?: string;
}

export interface ICholesterolScore {
  overallCategory: OverallCholesterolCategory;
  totalCholesterol?: number | null;
  totalCholesterolCategory?: TotalCholesterolCategory;
  totalCholesterolFailureReason?: string;
  hdlCholesterol?: number | null;
  hdlCholesterolCategory?: HdlCholesterolCategory;
  hdlCholesterolFailureReason?: string;
  totalCholesterolHdlRatio?: number | null;
  totalCholesterolHdlRatioCategory?: TotalCholesterolHdlRatioCategory;
  totalCholesterolHdlRatioFailureReason?: string;
}
