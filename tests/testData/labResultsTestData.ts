import { type LabOrderSchema } from '../lib/apiClients/labResultsApiResources/LabResultsApiResource';
import { v4 as uuidv4 } from 'uuid';
import { AuditCategory } from '../lib/enum/health-check-answers';
import {
  BmiClassification,
  LeicesterRiskCategory,
  BloodPressureCategory,
  ActivityCategory,
  SmokingCategory,
  type ILabResultData,
  type IQuestionnaireScores,
  type IRiskScores,
  type IDiabetesScore,
  type ICholesterolScore,
  DiabetesCategory,
  OverallDiabetesCategory,
  OverallCholesterolCategory,
  TotalCholesterolCategory,
  HdlCholesterolCategory,
  TotalCholesterolHdlRatioCategory,
  QRiskCategory,
  type IThrivaLabResults
} from '@dnhc-health-checks/shared';

import { BiomarkerCode, LabTestType } from '../../shared/model/enum/lab-result';

export enum LabResultsData {
  OldModelSuccessCholesterolHbA1c,
  NewModelSucessCholesterolHbA1c,
  PartialFailureCholesterolHbA1c,
  PartialFailureCholesterolOnlyCHOfailed,
  PartialFailureCholesterolOnlyHDLfailed,
  PartialFailureHbA1c,
  PartialResultsHbA1CFailedAndCHOfailed,
  CompleteFailureCholesterolHbA1c,
  CompleteFailureCholesterolOnly,
  NewModelSucessCholesterolOnly,
  NewModelSucessHbA1cOnly,
  HbA1cResultsFailed,
  SuccessCholesterolHbA1cHighRisk
}

export function getLabResults(caseType: LabResultsData): ILabResultData[] {
  switch (caseType) {
    case LabResultsData.NewModelSucessCholesterolHbA1c:
      return [
        {
          biomarkerCode: BiomarkerCode.GHBI,
          units: 'mmol/L',
          value: 25,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.CHO,
          units: 'mmol/L',
          value: 6.3,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.HDL,
          units: 'mmol/L',
          value: 1.5,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.CHDD,
          units: 'Ratio',
          value: 5,
          successful: true
        }
      ];
    case LabResultsData.OldModelSuccessCholesterolHbA1c:
      return [
        {
          biomarkerCode: BiomarkerCode.GHBI,
          units: 'mmol/L',
          value: 25,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.CHO,
          units: 'mmol/L',
          value: 6.3,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.HDL,
          units: 'mmol/L',
          value: 1.5,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.CHDD,
          units: 'Ratio',
          value: 5,
          successful: true
        }
      ];
    case LabResultsData.PartialFailureCholesterolHbA1c:
      return [
        {
          biomarkerCode: BiomarkerCode.GHBI,
          units: 'mmol/L',
          value: 25,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.CHO,
          units: 'mmol/L',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        },
        {
          biomarkerCode: BiomarkerCode.HDL,
          units: 'mmol/L',
          value: 1.5,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.CHDD,
          units: 'Ratio',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        }
      ];
    case LabResultsData.PartialFailureHbA1c:
      return [
        {
          biomarkerCode: BiomarkerCode.GHBI,
          units: 'mmol/L',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        },
        {
          biomarkerCode: BiomarkerCode.CHO,
          units: 'mmol/L',
          value: 6.3,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.HDL,
          units: 'mmol/L',
          value: 1.5,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.CHDD,
          units: 'Ratio',
          value: 5,
          successful: true
        }
      ];
    case LabResultsData.PartialResultsHbA1CFailedAndCHOfailed:
      return [
        {
          biomarkerCode: BiomarkerCode.GHBI,
          units: 'mmol/L',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        },
        {
          biomarkerCode: BiomarkerCode.CHO,
          units: 'mmol/L',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        },
        {
          biomarkerCode: BiomarkerCode.HDL,
          units: 'mmol/L',
          value: 1.5,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.CHDD,
          units: 'Ratio',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        }
      ];
    case LabResultsData.CompleteFailureCholesterolHbA1c:
      return [
        {
          biomarkerCode: BiomarkerCode.GHBI,
          units: 'mmol/L',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        },
        {
          biomarkerCode: BiomarkerCode.CHO,
          units: 'mmol/L',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        },
        {
          biomarkerCode: BiomarkerCode.HDL,
          units: 'mmol/L',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        },
        {
          biomarkerCode: BiomarkerCode.CHDD,
          units: 'Ratio',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        }
      ];
    case LabResultsData.CompleteFailureCholesterolOnly:
      return [
        {
          biomarkerCode: BiomarkerCode.CHO,
          units: 'mmol/L',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        },
        {
          biomarkerCode: BiomarkerCode.HDL,
          units: 'mmol/L',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        },
        {
          biomarkerCode: BiomarkerCode.CHDD,
          units: 'Ratio',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        }
      ];
    case LabResultsData.NewModelSucessHbA1cOnly:
      return [
        {
          biomarkerCode: BiomarkerCode.GHBI,
          units: 'mmol/L',
          value: 25,
          successful: true
        }
      ];
    case LabResultsData.HbA1cResultsFailed:
      return [
        {
          biomarkerCode: BiomarkerCode.GHBI,
          units: 'mmol/L',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        }
      ];
    case LabResultsData.NewModelSucessCholesterolOnly:
      return [
        {
          biomarkerCode: BiomarkerCode.CHO,
          units: 'mmol/L',
          value: 6.3,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.HDL,
          units: 'mmol/L',
          value: 1.5,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.CHDD,
          units: 'Ratio',
          value: 5,
          successful: true
        }
      ];
    case LabResultsData.PartialFailureCholesterolOnlyCHOfailed:
      return [
        {
          biomarkerCode: BiomarkerCode.CHO,
          units: 'mmol/L',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        },
        {
          biomarkerCode: BiomarkerCode.HDL,
          units: 'mmol/L',
          value: 1.5,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.CHDD,
          units: 'Ratio',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        }
      ];
    case LabResultsData.PartialFailureCholesterolOnlyHDLfailed:
      return [
        {
          biomarkerCode: BiomarkerCode.CHO,
          units: 'mmol/L',
          value: 6.2,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.HDL,
          units: 'mmol/L',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        },
        {
          biomarkerCode: BiomarkerCode.CHDD,
          units: 'Ratio',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        }
      ];
    case LabResultsData.SuccessCholesterolHbA1cHighRisk:
      return [
        {
          biomarkerCode: BiomarkerCode.GHBI,
          units: 'mmol/L',
          value: 49,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.CHO,
          units: 'mmol/L',
          value: 6.3,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.HDL,
          units: 'mmol/L',
          value: 1.5,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.CHDD,
          units: 'Ratio',
          value: 5,
          successful: true
        }
      ];
    default:
      return [
        {
          biomarkerCode: BiomarkerCode.GHBI,
          units: 'mmol/L',
          value: 25,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.CHO,
          units: 'mmol/L',
          value: 6.3,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.HDL,
          units: 'mmol/L',
          value: 1.5,
          successful: true
        },
        {
          biomarkerCode: BiomarkerCode.CHDD,
          units: 'Ratio',
          value: 5,
          successful: true
        }
      ];
  }
}

export function getLabResultsTestDataQuestionnaireScores(): IQuestionnaireScores {
  return {
    activityCategory: ActivityCategory.ModeratelyActive,
    auditCategory: AuditCategory.NoRisk,
    auditScore: 0,
    bloodPressureCategory: BloodPressureCategory.Healthy,
    bmiClassification: BmiClassification.Overweight,
    bmiScore: 27.6,
    gppaqScore: 4
  };
}

export function getLabResultsTestDataQuestionnaireScoresUnderweight(): IQuestionnaireScores {
  return {
    activityCategory: ActivityCategory.Active,
    auditCategory: AuditCategory.NoRisk,
    auditScore: 0,
    bloodPressureCategory: BloodPressureCategory.Healthy,
    bmiClassification: BmiClassification.Underweight,
    bmiScore: 18.4,
    gppaqScore: 9,
    inProgressAuditScore: null,
    leicesterRiskCategory: LeicesterRiskCategory.Medium,
    leicesterRiskScore: 10,
    smokingCategory: SmokingCategory.ExSmoker,
    townsendScore: null
  };
}

export function getLabResultsTestDataQuestionnaireScoresHealthy(): IQuestionnaireScores {
  return {
    activityCategory: ActivityCategory.ModeratelyActive,
    auditCategory: AuditCategory.NoRisk,
    auditScore: 0,
    bloodPressureCategory: BloodPressureCategory.High,
    bmiClassification: BmiClassification.Healthy,
    bmiScore: 18.5,
    gppaqScore: 4,
    inProgressAuditScore: null,
    leicesterRiskCategory: LeicesterRiskCategory.Medium,
    leicesterRiskScore: 10,
    smokingCategory: SmokingCategory.ExSmoker,
    townsendScore: null
  };
}

export function getLabResultsTestDataQuestionnaireScoresOverweight(): IQuestionnaireScores {
  return {
    activityCategory: ActivityCategory.ModeratelyActive,
    auditCategory: AuditCategory.NoRisk,
    auditScore: 0,
    bloodPressureCategory: BloodPressureCategory.High,
    bmiClassification: BmiClassification.Overweight,
    bmiScore: 27,
    gppaqScore: 4,
    inProgressAuditScore: null,
    leicesterRiskCategory: LeicesterRiskCategory.Medium,
    leicesterRiskScore: 10,
    smokingCategory: SmokingCategory.ExSmoker,
    townsendScore: null
  };
}

export function getLabResultsTestDataQuestionnaireScoresObese(): IQuestionnaireScores {
  return {
    activityCategory: ActivityCategory.ModeratelyActive,
    auditCategory: AuditCategory.NoRisk,
    auditScore: 0,
    bloodPressureCategory: BloodPressureCategory.Healthy,
    bmiClassification: BmiClassification.Obese1,
    bmiScore: 30,
    gppaqScore: 9,
    inProgressAuditScore: null,
    leicesterRiskCategory: LeicesterRiskCategory.High,
    leicesterRiskScore: 16,
    smokingCategory: SmokingCategory.ExSmoker,
    townsendScore: null
  };
}

export function getLabResultsTestDataLabOrder(
  healthCheckId: string
): LabOrderSchema {
  return {
    id: uuidv4(),
    deliveryAddress: {
      postcode: 'AB1 1AB',
      addressLine1: 'line1',
      addressLine2: 'line2',
      townCity: 'London'
    },
    healthCheckId,
    testTypes: [LabTestType.Cholesterol],
    preferredContactMethod: 'Email'
  };
}

export function getExpectedLabResultsTestDataQriskScores(): IRiskScores {
  return {
    heartAge: 84,
    scoreCalculationDate: '2024-06-12T08:20:58.538Z',
    qRiskScore: 38.96,
    qRiskScoreCategory: QRiskCategory.High
  };
}

export function getExpectedCholesterol(
  overrides?: Partial<ICholesterolScore>
): ICholesterolScore {
  return {
    overallCategory: OverallCholesterolCategory.Normal,
    totalCholesterol: 2.5,
    totalCholesterolCategory: TotalCholesterolCategory.Normal,
    hdlCholesterol: 1.2,
    hdlCholesterolCategory: HdlCholesterolCategory.Normal,
    totalCholesterolHdlRatio: 1,
    totalCholesterolHdlRatioCategory: TotalCholesterolHdlRatioCategory.Normal,
    ...overrides
  };
}

export function getExpectedDiabetes(
  overrides?: Partial<IDiabetesScore>
): IDiabetesScore {
  return {
    overallCategory: OverallDiabetesCategory.Low,
    category: DiabetesCategory.Low,
    hba1c: 20,
    ...overrides
  };
}

export const cholesterolTestData = getExpectedCholesterol({
  overallCategory: OverallCholesterolCategory.High,
  totalCholesterol: 6.3,
  totalCholesterolCategory: TotalCholesterolCategory.High,
  hdlCholesterol: 1.5,
  totalCholesterolHdlRatio: 5
});

export const diabetesTestData = getExpectedDiabetes({
  hba1c: 25,
  category: DiabetesCategory.Low,
  overallCategory: OverallDiabetesCategory.Low
});

export const diabetesTestDataNull = getExpectedDiabetes({
  hba1c: null,
  category: DiabetesCategory.LowRiskNoBloodTest,
  overallCategory: OverallDiabetesCategory.LowRiskNoBloodTest
});

export function getDiabetesTestFailureData(
  overrides?: Partial<IDiabetesScore>
): IDiabetesScore {
  return {
    overallCategory: OverallDiabetesCategory.CompleteFailure,
    failureReason: 'not_calculated#The result was not calculated',
    ...overrides
  };
}

export function getPartialResultsCholesterolTestDataCHOfailed(
  overrides?: Partial<ICholesterolScore>
): ICholesterolScore {
  return {
    overallCategory: OverallCholesterolCategory.PartialFailure,
    hdlCholesterolCategory: HdlCholesterolCategory.Normal,
    hdlCholesterol: 1.5,
    totalCholesterolFailureReason:
      'not_calculated#The result was not calculated',
    totalCholesterolHdlRatioFailureReason:
      'not_calculated#The result was not calculated',
    ...overrides
  };
}

export function getPartialResultsCholesterolTestDataHDLfailed(
  overrides?: Partial<ICholesterolScore>
): ICholesterolScore {
  return {
    overallCategory: OverallCholesterolCategory.PartialFailure,
    totalCholesterolCategory: TotalCholesterolCategory.High,
    totalCholesterol: 6.2,
    hdlCholesterolFailureReason: 'not_calculated#The result was not calculated',
    totalCholesterolHdlRatioFailureReason:
      'not_calculated#The result was not calculated',
    ...overrides
  };
}

export function getCompleteFailureResultsCholesterolTestData(
  overrides?: Partial<ICholesterolScore>
): ICholesterolScore {
  return {
    hdlCholesterolFailureReason: 'not_calculated#The result was not calculated',
    overallCategory: OverallCholesterolCategory.CompleteFailure,
    totalCholesterolFailureReason:
      'not_calculated#The result was not calculated',
    totalCholesterolHdlRatioFailureReason:
      'not_calculated#The result was not calculated',
    ...overrides
  };
}

export function getLabResultsData(
  labResult: ILabResultData[],
  labOrderId?: string
): IThrivaLabResults {
  return {
    orderId: 'TEST87654323',
    orderExternalReference: labOrderId ?? '',
    resultData: labResult,
    pendingReorder: false,
    resultDate: new Date().toISOString()
  };
}
