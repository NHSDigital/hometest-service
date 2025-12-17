import { type LeicesterDiabetesRiskScoreData } from '../lib/apiClients/HealthCheckModel';
import {
  AsianOrAsianBritish,
  BlackAfricanCaribbeanOrBlackBritish,
  EthnicBackground,
  MixedOrMultipleGroups,
  OtherEthnicity,
  ParentSiblingChildDiabetes,
  Sex,
  WhiteEthnicBackground
} from '../lib/enum/health-check-answers';

export enum RiskCategoryValues {
  LOW = 'Low',
  INCOMPLETE = 'none',
  MEDIUM = 'Medium',
  HIGH = 'High',
  VERY_HIGH = 'Very High'
}

export function getLeicesterDiabetesRiskScoreLowTestData(): LeicesterDiabetesRiskScoreData {
  return {
    ethnicBackground: EthnicBackground.White,
    detailedEthnicGroup: WhiteEthnicBackground.Irish,
    weight: 50,
    height: 160,
    waistMeasurement: 85,
    sex: Sex.Female,
    hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.No
  };
}

export function getLeicesterDiabetesRiskScoreMediumTestData(
  age: number
): LeicesterDiabetesRiskScoreData {
  if (age <= 49) {
    return {
      ethnicBackground: EthnicBackground.AsianOrAsianBritish,
      detailedEthnicGroup: AsianOrAsianBritish.Chinese,
      weight: 50,
      height: 160,
      waistMeasurement: 85,
      sex: Sex.Female,
      hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.Yes
    };
  } else if (age >= 50 && age <= 59) {
    return {
      ethnicBackground: EthnicBackground.AsianOrAsianBritish,
      detailedEthnicGroup: AsianOrAsianBritish.Chinese,
      weight: 50,
      height: 160,
      waistMeasurement: 85,
      sex: Sex.Female,
      hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.No
    };
  } else {
    return {
      ethnicBackground: EthnicBackground.White,
      detailedEthnicGroup: WhiteEthnicBackground.Irish,
      weight: 50,
      height: 160,
      waistMeasurement: 85,
      sex: Sex.Female,
      hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.No
    };
  }
}
export function getLeicesterDiabetesRiskScoreHighTestData(
  age: number
): LeicesterDiabetesRiskScoreData {
  if (age <= 49) {
    return {
      ethnicBackground: EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
      detailedEthnicGroup: BlackAfricanCaribbeanOrBlackBritish.Caribbean,
      weight: 77,
      height: 160,
      waistMeasurement: 110,
      sex: Sex.Male,
      hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.No
    };
  }
  if (age >= 50 && age <= 59) {
    return {
      ethnicBackground: EthnicBackground.MixedOrMultipleGroups,
      detailedEthnicGroup: MixedOrMultipleGroups.WhiteAndAsian,
      weight: 50,
      height: 160,
      waistMeasurement: 85,
      sex: Sex.Male,
      hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.Yes
    };
  } else {
    return {
      ethnicBackground: EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
      detailedEthnicGroup: BlackAfricanCaribbeanOrBlackBritish.African,
      weight: 50,
      height: 160,
      waistMeasurement: 85,
      sex: Sex.Female,
      hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.Yes
    };
  }
}

export function getLeicesterDiabetesRiskScoreVeryHighTestData(
  age: number
): LeicesterDiabetesRiskScoreData {
  if (age <= 49) {
    return {
      ethnicBackground: EthnicBackground.Other,
      detailedEthnicGroup: OtherEthnicity.Arab,
      weight: 100,
      height: 160,
      waistMeasurement: 110,
      sex: Sex.Male,
      hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.Yes
    };
  } else if (age >= 50 && age <= 59) {
    return {
      ethnicBackground: EthnicBackground.Other,
      detailedEthnicGroup: OtherEthnicity.OtherEthnicGroup,
      weight: 100,
      height: 160,
      waistMeasurement: 110,
      sex: Sex.Male,
      hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.Yes
    };
  } else {
    return {
      ethnicBackground: EthnicBackground.Other,
      detailedEthnicGroup: OtherEthnicity.PreferNotToSay,
      weight: 100,
      height: 160,
      waistMeasurement: 110,
      sex: Sex.Male,
      hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.Yes
    };
  }
}

export function getLeicesterDiabetesRiskScoreIncompleteTestData(): any {
  return {
    weight: 100,
    height: 160,
    waistMeasurement: 110,
    sex: Sex.Male,
    hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.Yes
  };
}

export function getLeicesterDiabetesRiskScoreBasedOnRiskCategory(
  riskCategory: RiskCategoryValues,
  age: number
): LeicesterDiabetesRiskScoreData {
  switch (riskCategory) {
    case RiskCategoryValues.HIGH:
      return getLeicesterDiabetesRiskScoreHighTestData(age);
    case RiskCategoryValues.VERY_HIGH:
      return getLeicesterDiabetesRiskScoreVeryHighTestData(age);
    case RiskCategoryValues.MEDIUM:
      return getLeicesterDiabetesRiskScoreMediumTestData(age);
    case RiskCategoryValues.LOW:
      return getLeicesterDiabetesRiskScoreLowTestData();
    case RiskCategoryValues.INCOMPLETE:
      return getLeicesterDiabetesRiskScoreIncompleteTestData();
  }
}
