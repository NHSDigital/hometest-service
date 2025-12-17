import {
  BmiClassification,
  EthnicBackground,
  LeicesterRiskCategory,
  Sex,
  type IHealthCheckAnswers,
  type IQuestionnaireScores
} from '@dnhc-health-checks/shared';
import {
  questionnairesData,
  questionnairesScoresData
} from './questionnairesTestData';

export function questionnairesDataBodyMeasurements(
  override?: Partial<IHealthCheckAnswers>
): IHealthCheckAnswers {
  return {
    ...questionnairesData(),
    ...{
      waistMeasurement: null,
      weight: null,
      isBodyMeasurementsSectionSubmitted: false,
      weightDisplayPreference: null
    },
    ...override
  };
}

export function questionnairesDataScoreBodyMeasurements(
  override?: Partial<IQuestionnaireScores>
): IQuestionnaireScores {
  return {
    ...questionnairesScoresData(),
    ...override
  };
}

export function questionnairesDataBodyMeasurementsLowRisk(): IHealthCheckAnswers {
  return questionnairesDataBodyMeasurements({
    detailedEthnicGroup: 'Irish',
    ethnicBackground: EthnicBackground.White,
    sex: Sex.Female
  });
}

export function questionnairesDataScoreBodyMeasurementsLowRisk(): IQuestionnaireScores {
  return questionnairesDataScoreBodyMeasurements({
    bmiClassification: BmiClassification.Healthy,
    bmiScore: 19.5,
    leicesterRiskCategory: LeicesterRiskCategory.Low,
    leicesterRiskScore: 6
  });
}

export function questionnairesDataScoreBodyMeasurementsHighRisk(): IQuestionnaireScores {
  return questionnairesDataScoreBodyMeasurements({
    bmiClassification: BmiClassification.Healthy,
    bmiScore: 19.5,
    leicesterRiskCategory: LeicesterRiskCategory.VeryHigh,
    leicesterRiskScore: 16
  });
}
