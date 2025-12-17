import { Commons } from '../../../src/lib/commons';
import Sinon from 'ts-sinon';
import {
  HealthCheckFollowUpService,
  FollowUpType
} from '../../../src/lib/follow-ups/health-check-follow-up-service';
import {
  BloodPressureLocation,
  Sex,
  Smoking,
  type IHealthCheck,
  ActivityCategory,
  BmiClassification,
  OverallCholesterolCategory,
  OverallDiabetesCategory
} from '@dnhc-health-checks/shared';

describe('HealthCheckFollowUpService tests', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;

  let service: HealthCheckFollowUpService;

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    service = new HealthCheckFollowUpService(commonsStub as unknown as Commons);
  });

  describe('getQRiskFollowUpDetails', () => {
    test.each([
      [
        'Returns undefined / no follow up for QRisk score just below 10',
        { riskScores: { qRiskScore: 9.99 } },
        undefined
      ],
      [
        'Returns routine follow up for QRisk score exactly 10',
        { riskScores: { qRiskScore: 10 } },
        {
          followUpType: FollowUpType.Routine,
          followUpReasonText: 'QRisk score is 10 or over'
        }
      ],
      [
        'Returns routine follow up for QRisk score just below 20',
        { riskScores: { qRiskScore: 19.99 } },
        {
          followUpType: FollowUpType.Routine,
          followUpReasonText: 'QRisk score is 10 or over'
        }
      ],
      [
        'Returns urgent follow up for QRisk score exactly 20',
        { riskScores: { qRiskScore: 20 } },
        {
          followUpType: FollowUpType.Urgent,
          followUpReasonText: 'QRisk score is 20 or over'
        }
      ],
      [
        'Returns urgent follow up for QRisk score just above 20',
        { riskScores: { qRiskScore: 20.01 } },
        {
          followUpType: FollowUpType.Urgent,
          followUpReasonText: 'QRisk score is 20 or over'
        }
      ],
      ['Returns undefined / no follow up for missing riskScores', {}, undefined]
    ])('%s', (_desc, input, expected) => {
      const result = service.getQRiskFollowUpDetails(input as IHealthCheck);
      if (expected) {
        expect(result).toMatchObject({
          snomedCodes: ['qRiskScore'],
          ...expected
        });
      } else {
        expect(result).toBeUndefined();
      }
    });
  });

  describe('getLeicesterRiskFollowUpDetails', () => {
    test.each([
      [
        'Returns undefined / no follow up for Leicester risk score just below 15',
        { questionnaireScores: { leicesterRiskScore: 14.99 } },
        undefined
      ],
      [
        'Returns undefined / no follow up for Leicester risk score exactly 15',
        { questionnaireScores: { leicesterRiskScore: 15 } },
        undefined
      ],
      [
        'Returns routine follow up for Leicester risk score just above 15',
        {
          questionnaireScores: { leicesterRiskScore: 15.01 }
        },
        {
          followUpType: FollowUpType.Routine,
          followUpReasonText: 'Diabetes: Leicester risk score is over 15'
        }
      ],
      [
        'Returns routine follow up for Leicester risk score just under 25',
        { questionnaireScores: { leicesterRiskScore: 24.99 } },
        {
          followUpType: FollowUpType.Routine,
          followUpReasonText: 'Diabetes: Leicester risk score is over 15'
        }
      ],
      [
        'Returns urgent follow up for Leicester risk score exactly 25',
        { questionnaireScores: { leicesterRiskScore: 25 } },
        {
          followUpType: FollowUpType.Urgent,
          followUpReasonText: 'Diabetes: Leicester risk score is 25 or over'
        }
      ],
      [
        'Returns urgent follow up for Leicester risk score exactly 25',
        { questionnaireScores: { leicesterRiskScore: 25 } },
        {
          followUpType: FollowUpType.Urgent,
          followUpReasonText: 'Diabetes: Leicester risk score is 25 or over'
        }
      ],
      [
        'Returns urgent follow up for Leicester risk score above 25',
        { questionnaireScores: { leicesterRiskScore: 27 } },
        {
          followUpType: FollowUpType.Urgent,
          followUpReasonText: 'Diabetes: Leicester risk score is 25 or over'
        }
      ],
      [
        'Returns undefined / no follow up for null Leicester risk score',
        { questionnaireScores: { leicesterRiskScore: null } },
        undefined
      ],
      [
        'Returns undefined / no follow up for missing questionnaireScores',
        {},
        undefined
      ]
    ])('%s', (_desc, input, expected) => {
      const result = service.getLeicesterRiskFollowUpDetails(
        input as IHealthCheck
      );
      if (expected) {
        expect(result).toMatchObject({
          snomedCodes: ['diabetesRiskScore'],
          ...expected
        });
      } else {
        expect(result).toBeUndefined();
      }
    });
  });

  describe('getSystolicBloodPressureFollowUpDetails', () => {
    describe('at Pharmacy', () => {
      test.each([
        [
          'Returns urgent follow up for systolic just below 90',
          {
            questionnaire: {
              bloodPressureSystolic: 89.99,
              bloodPressureLocation: BloodPressureLocation.Pharmacy
            }
          },
          {
            followUpType: FollowUpType.Urgent,
            followUpReasonText:
              'Blood pressure reading: Systolic is under 90 mmHg',
            snomedCodes: ['systolicBP1']
          }
        ],
        [
          'Returns undefined / no follow up for systolic exactly 90',
          {
            questionnaire: {
              bloodPressureSystolic: 90,
              bloodPressureLocation: BloodPressureLocation.Pharmacy
            }
          },
          undefined
        ],
        [
          'Returns undefined / no follow up for systolic just below 140',
          {
            questionnaire: {
              bloodPressureSystolic: 139.99,
              bloodPressureLocation: BloodPressureLocation.Pharmacy
            }
          },
          undefined
        ],
        [
          'Returns routine follow up for systolic exactly 140',
          {
            questionnaire: {
              bloodPressureSystolic: 140,
              bloodPressureLocation: BloodPressureLocation.Pharmacy
            }
          },
          {
            followUpType: FollowUpType.Routine,
            followUpReasonText:
              'Blood pressure reading: Systolic is between 140 - 179 mmHg',
            snomedCodes: ['systolicBP1']
          }
        ],
        [
          'Returns routine follow up for systolic just under 180',
          {
            questionnaire: {
              bloodPressureSystolic: 179.99,
              bloodPressureLocation: BloodPressureLocation.Pharmacy
            }
          },
          {
            followUpType: FollowUpType.Routine,
            followUpReasonText:
              'Blood pressure reading: Systolic is between 140 - 179 mmHg',
            snomedCodes: ['systolicBP1']
          }
        ],
        [
          'Returns urgent follow up for systolic exactly 180',
          {
            questionnaire: {
              bloodPressureSystolic: 180,
              bloodPressureLocation: BloodPressureLocation.Pharmacy
            }
          },
          {
            followUpType: FollowUpType.Urgent,
            followUpReasonText:
              'Blood pressure reading: Systolic is 180 mmHg or over',
            snomedCodes: ['systolicBP1']
          }
        ],
        [
          'Returns undefined / no follow up for undefined systolic',
          {
            questionnaire: {
              bloodPressureSystolic: undefined,
              bloodPressureLocation: BloodPressureLocation.Pharmacy
            }
          },
          undefined
        ]
      ])('%s', (_desc, input, expected) => {
        const result = service.getSystolicBloodPressureFollowUpDetails(
          input as IHealthCheck
        );
        if (expected) {
          expect(result).toMatchObject(expected);
        } else {
          expect(result).toBeUndefined();
        }
      });
    });

    describe('at Monitor (Home)', () => {
      test.each([
        [
          'Returns urgent follow up for systolic just below 90',
          {
            questionnaire: {
              bloodPressureSystolic: 89.99,
              bloodPressureLocation: BloodPressureLocation.Monitor
            }
          },
          {
            followUpType: FollowUpType.Urgent,
            followUpReasonText:
              'Blood pressure reading: Systolic is under 90 mmHg',
            snomedCodes: ['systolicBP1Home']
          }
        ],
        [
          'Returns undefined / no follow up for systolic exactly 90',
          {
            questionnaire: {
              bloodPressureSystolic: 90,
              bloodPressureLocation: BloodPressureLocation.Monitor
            }
          },
          undefined
        ],
        [
          'Returns undefined / no follow up for systolic just below 135',
          {
            questionnaire: {
              bloodPressureSystolic: 134.99,
              bloodPressureLocation: BloodPressureLocation.Monitor
            }
          },
          undefined
        ],
        [
          'Returns routine follow up for systolic exactly 135',
          {
            questionnaire: {
              bloodPressureSystolic: 135,
              bloodPressureLocation: BloodPressureLocation.Monitor
            }
          },
          {
            followUpType: FollowUpType.Routine,
            followUpReasonText:
              'Blood pressure reading: Systolic is between 135 - 169 mmHg',
            snomedCodes: ['systolicBP1Home']
          }
        ],
        [
          'Returns routine follow up for systolic just below 170',
          {
            questionnaire: {
              bloodPressureSystolic: 169.99,
              bloodPressureLocation: BloodPressureLocation.Monitor
            }
          },
          {
            followUpType: FollowUpType.Routine,
            followUpReasonText:
              'Blood pressure reading: Systolic is between 135 - 169 mmHg',
            snomedCodes: ['systolicBP1Home']
          }
        ],
        [
          'Returns urgent follow up for systolic exactly 170',
          {
            questionnaire: {
              bloodPressureSystolic: 170,
              bloodPressureLocation: BloodPressureLocation.Monitor
            }
          },
          {
            followUpType: FollowUpType.Urgent,
            followUpReasonText:
              'Blood pressure reading: Systolic is 170 mmHg or over',
            snomedCodes: ['systolicBP1Home']
          }
        ],
        [
          'Returns undefined / no follow up for undefined systolic',
          {
            questionnaire: {
              bloodPressureSystolic: undefined,
              bloodPressureLocation: BloodPressureLocation.Monitor
            }
          },
          undefined
        ]
      ])('%s', (_desc, input, expected) => {
        const result = service.getSystolicBloodPressureFollowUpDetails(
          input as IHealthCheck
        );
        if (expected) {
          expect(result).toMatchObject(expected);
        } else {
          expect(result).toBeUndefined();
        }
      });
    });

    describe('with missing or undefined bloodPressureLocation', () => {
      test.each([
        [
          'Returns undefined / no follow up for undefined location',
          {
            questionnaire: {
              bloodPressureSystolic: 120,
              bloodPressureLocation: undefined
            }
          }
        ],
        ['Returns undefined / no follow up for missing questionnaire', {}]
      ])('%s', (_desc, input) => {
        const result = service.getSystolicBloodPressureFollowUpDetails(
          input as IHealthCheck
        );
        expect(result).toBeUndefined();
      });
    });
  });

  describe('getDiastolicBloodPressureFollowUpDetails', () => {
    describe('at Pharmacy', () => {
      test.each([
        [
          'Returns urgent follow up for diastolic just below 60',
          {
            questionnaire: {
              bloodPressureDiastolic: 59.99,
              bloodPressureLocation: BloodPressureLocation.Pharmacy
            }
          },
          {
            followUpType: FollowUpType.Urgent,
            snomedCodes: ['diastolicBP1'],
            followUpReasonText:
              'Blood pressure reading: Diastolic is under 60 mmHg'
          }
        ],
        [
          'Returns undefined / no follow up for diastolic exactly 60',
          {
            questionnaire: {
              bloodPressureDiastolic: 60,
              bloodPressureLocation: BloodPressureLocation.Pharmacy
            }
          },
          undefined
        ],
        [
          'Returns undefined / no follow up for diastolic just below 90',
          {
            questionnaire: {
              bloodPressureDiastolic: 89.99,
              bloodPressureLocation: BloodPressureLocation.Pharmacy
            }
          },
          undefined
        ],
        [
          'Returns routine follow up for diastolic exactly 90',
          {
            questionnaire: {
              bloodPressureDiastolic: 90,
              bloodPressureLocation: BloodPressureLocation.Pharmacy
            }
          },
          {
            followUpType: FollowUpType.Routine,
            snomedCodes: ['diastolicBP1'],
            followUpReasonText:
              'Blood pressure reading: Diastolic is between 90 - 119 mmHg'
          }
        ],
        [
          'Returns routine follow up for diastolic just below 120',
          {
            questionnaire: {
              bloodPressureDiastolic: 119.99,
              bloodPressureLocation: BloodPressureLocation.Pharmacy
            }
          },
          {
            followUpType: FollowUpType.Routine,
            snomedCodes: ['diastolicBP1'],
            followUpReasonText:
              'Blood pressure reading: Diastolic is between 90 - 119 mmHg'
          }
        ],
        [
          'Returns urgent follow up for diastolic exactly 120',
          {
            questionnaire: {
              bloodPressureDiastolic: 120,
              bloodPressureLocation: BloodPressureLocation.Pharmacy
            }
          },
          {
            followUpType: FollowUpType.Urgent,
            snomedCodes: ['diastolicBP1'],
            followUpReasonText:
              'Blood pressure reading: Diastolic is 120 mmHg or over'
          }
        ],
        [
          'Returns undefined / no follow up for undefined diastolic',
          {
            questionnaire: {
              bloodPressureDiastolic: undefined,
              bloodPressureLocation: BloodPressureLocation.Pharmacy
            }
          },
          undefined
        ]
      ])('%s', (_desc, input, expected) => {
        const result = service.getDiastolicBloodPressureFollowUpDetails(
          input as IHealthCheck
        );
        if (expected) {
          expect(result).toMatchObject(expected);
        } else {
          expect(result).toBeUndefined();
        }
      });
    });

    describe('at Monitor (Home)', () => {
      test.each([
        [
          'Returns urgent follow up for diastolic just below 60',
          {
            questionnaire: {
              bloodPressureDiastolic: 59.99,
              bloodPressureLocation: BloodPressureLocation.Monitor
            }
          },
          {
            followUpType: FollowUpType.Urgent,
            followUpReasonText:
              'Blood pressure reading: Diastolic is under 60 mmHg',
            snomedCodes: ['diastolicBP1Home']
          }
        ],
        [
          'Returns undefined / no follow up for diastolic exactly 60',
          {
            questionnaire: {
              bloodPressureDiastolic: 60,
              bloodPressureLocation: BloodPressureLocation.Monitor
            }
          },
          undefined
        ],
        [
          'Returns undefined / no follow up for diastolic just below 85',
          {
            questionnaire: {
              bloodPressureDiastolic: 84.99,
              bloodPressureLocation: BloodPressureLocation.Monitor
            }
          },
          undefined
        ],
        [
          'Returns routine follow up for diastolic exactly 85',
          {
            questionnaire: {
              bloodPressureDiastolic: 85,
              bloodPressureLocation: BloodPressureLocation.Monitor
            }
          },
          {
            followUpType: FollowUpType.Routine,
            followUpReasonText:
              'Blood pressure reading: Diastolic is between 85 - 99 mmHg',
            snomedCodes: ['diastolicBP1Home']
          }
        ],
        [
          'Returns routine follow up for diastolic just under 100',
          {
            questionnaire: {
              bloodPressureDiastolic: 99.99,
              bloodPressureLocation: BloodPressureLocation.Monitor
            }
          },
          {
            followUpType: FollowUpType.Routine,
            followUpReasonText:
              'Blood pressure reading: Diastolic is between 85 - 99 mmHg',
            snomedCodes: ['diastolicBP1Home']
          }
        ],
        [
          'Returns urgent follow up for diastolic exactly 100',
          {
            questionnaire: {
              bloodPressureDiastolic: 100,
              bloodPressureLocation: BloodPressureLocation.Monitor
            }
          },
          {
            followUpType: FollowUpType.Urgent,
            followUpReasonText:
              'Blood pressure reading: Diastolic is 100 mmHg or over',
            snomedCodes: ['diastolicBP1Home']
          }
        ],
        [
          'Returns undefined / no follow up for undefined diastolic',
          {
            questionnaire: {
              bloodPressureDiastolic: undefined,
              bloodPressureLocation: BloodPressureLocation.Monitor
            }
          },
          undefined
        ]
      ])('%s', (_desc, input, expected) => {
        const result = service.getDiastolicBloodPressureFollowUpDetails(
          input as IHealthCheck
        );
        if (expected) {
          expect(result).toMatchObject(expected);
        } else {
          expect(result).toBeUndefined();
        }
      });
    });

    describe('with missing or undefined bloodPressureLocation', () => {
      test.each([
        [
          'Returns undefined / no follow up for undefined location',
          {
            questionnaire: {
              bloodPressureDiastolic: 80,
              bloodPressureLocation: undefined
            }
          }
        ],
        ['Returns undefined / no follow up for missing questionnaire', {}]
      ])('%s', (_desc, input) => {
        const result = service.getDiastolicBloodPressureFollowUpDetails(
          input as IHealthCheck
        );
        expect(result).toBeUndefined();
      });
    });
  });

  describe('getAlcoholAuditFollowUpDetails', () => {
    test.each([
      [
        'Returns undefined / no follow up for auditScore just below 16',
        { questionnaireScores: { auditScore: 15.99 } },
        undefined
      ],
      [
        'Returns urgent follow up for auditScore exactly 16',
        { questionnaireScores: { auditScore: 16 } },
        {
          followUpType: FollowUpType.Urgent,
          followUpReasonText: 'Alcohol AUDIT score is 16 or over'
        }
      ],
      [
        'Returns urgent follow up for auditScore just above 16',
        { questionnaireScores: { auditScore: 16.01 } },
        {
          followUpType: FollowUpType.Urgent,
          followUpReasonText: 'Alcohol AUDIT score is 16 or over'
        }
      ],
      [
        'Returns undefined / no follow up for null auditScore',
        { questionnaireScores: { auditScore: null } },
        undefined
      ],
      [
        'Returns undefined / no follow up for missing questionnaireScores',
        {},
        undefined
      ]
    ])('%s', (_desc, input, expected) => {
      const result = service.getAlcoholAuditFollowUpDetails(
        input as IHealthCheck
      );
      if (expected) {
        expect(result).toMatchObject({
          snomedCodes: ['alcoholAudit'],
          ...expected
        });
      } else {
        expect(result).toBeUndefined();
      }
    });
  });

  describe('getCholesterolFollowUpDetails', () => {
    let getLatestBiometricScoreStub: Sinon.SinonStub;
    beforeEach(() => {
      getLatestBiometricScoreStub = sandbox.stub(
        require('../../../src/lib/utils'),
        'getLatestBiometricScoreFromHealthCheck'
      );
    });
    afterEach(() => {
      getLatestBiometricScoreStub.restore();
    });

    test.each([
      [
        'returns undefined / no follow up for totalCholesterol just below 5',
        { scores: { cholesterol: { totalCholesterol: 4.99 } } },
        undefined
      ],
      [
        'returns undefined / no follow up for totalCholesterol exactly 5',
        { scores: { cholesterol: { totalCholesterol: 5 } } },
        undefined
      ],
      [
        'returns routine follow up for totalCholesterol just above 5',
        { scores: { cholesterol: { totalCholesterol: 5.01 } } },
        {
          snomedCodes: ['cholesterol'],
          followUpType: FollowUpType.Routine,
          followUpReasonText: 'Total cholesterol is over 5mmol/L'
        }
      ],
      [
        'returns urgent follow up for totalCholesterol exactly 9',
        { scores: { cholesterol: { totalCholesterol: 9 } } },
        {
          snomedCodes: ['cholesterol'],
          followUpType: FollowUpType.Urgent,
          followUpReasonText: 'Total cholesterol is 9mmol/L or over'
        }
      ],
      [
        'returns urgent follow up for totalCholesterol above 9',
        { scores: { cholesterol: { totalCholesterol: 10 } } },
        {
          snomedCodes: ['cholesterol'],
          followUpType: FollowUpType.Urgent,
          followUpReasonText: 'Total cholesterol is 9mmol/L or over'
        }
      ],
      [
        'returns undefined / no follow up if cholesterolScore is undefined',
        undefined,
        undefined
      ],
      [
        'returns undefined / no follow up if totalCholesterol is undefined',
        { scores: { cholesterol: {} } },
        undefined
      ]
    ])('%s', (_desc, stubReturn, expected) => {
      getLatestBiometricScoreStub.returns(stubReturn);
      const result = service.getCholesterolFollowUpDetails(
        {} as unknown as IHealthCheck
      );
      if (expected) {
        expect(result).toMatchObject(expected);
      } else {
        expect(result).toBeUndefined();
      }
    });
  });

  describe('getDiabetesFollowUpDetails', () => {
    let getLatestBiometricScoreStub: Sinon.SinonStub;
    beforeEach(() => {
      getLatestBiometricScoreStub = sandbox.stub(
        require('../../../src/lib/utils'),
        'getLatestBiometricScoreFromHealthCheck'
      );
    });
    afterEach(() => {
      getLatestBiometricScoreStub.restore();
    });
    test.each([
      [
        'Returns undefined / no follow up for hba1c just below 42',
        { biometricScores: [{ scores: { diabetes: { hba1c: 41.99 } } }] },
        undefined
      ],
      [
        'Returns routine follow up for hba1c exactly 42',
        { biometricScores: [{ scores: { diabetes: { hba1c: 42 } } }] },
        {
          followUpType: FollowUpType.Routine,
          followUpReasonText:
            'HbA1c is 42mmol/L or higher and less than 48mmol/L'
        }
      ],
      [
        'Returns routine follow up for hba1c just below 48',
        { biometricScores: [{ scores: { diabetes: { hba1c: 47.99 } } }] },
        {
          followUpType: FollowUpType.Routine,
          followUpReasonText:
            'HbA1c is 42mmol/L or higher and less than 48mmol/L'
        }
      ],
      [
        'Returns urgent follow up for hba1c exactly 48',
        { biometricScores: [{ scores: { diabetes: { hba1c: 48 } } }] },
        {
          followUpType: FollowUpType.Urgent,
          followUpReasonText: 'HbA1c is 48mmol/L or over'
        }
      ],
      [
        'Returns urgent follow up for hba1c just above 48',
        { biometricScores: [{ scores: { diabetes: { hba1c: 48.01 } } }] },
        {
          followUpType: FollowUpType.Urgent,
          followUpReasonText: 'HbA1c is 48mmol/L or over'
        }
      ],
      [
        'Returns undefined / no follow up for undefined hba1c',
        { biometricScores: [{ scores: { diabetes: {} } }] },
        undefined
      ],
      [
        'Returns undefined / no follow up for missing biometricScores',
        {},
        undefined
      ]
    ])('%s', (_desc, input, expected) => {
      getLatestBiometricScoreStub.returns(
        (input as IHealthCheck).biometricScores?.[0]
      );
      const result = service.getDiabetesFollowUpDetails({} as IHealthCheck);
      if (expected) {
        expect(result).toMatchObject({
          snomedCodes: ['hba1cDiabetes'],
          ...expected
        });
      } else {
        expect(result).toBeUndefined();
      }
    });
  });

  describe('getBmiFollowUpDetails', () => {
    test.each([
      [
        'Returns routine follow up for Obese1',
        {
          questionnaireScores: { bmiClassification: BmiClassification.Obese1 }
        },
        {
          followUpType: FollowUpType.Routine,
          followUpReasonText: 'BMI is in the obesity category'
        }
      ],
      [
        'Returns routine follow up for Obese2',
        {
          questionnaireScores: { bmiClassification: BmiClassification.Obese2 }
        },
        {
          followUpType: FollowUpType.Routine,
          followUpReasonText: 'BMI is in the obesity category'
        }
      ],
      [
        'Returns routine follow up for Obese3',
        {
          questionnaireScores: { bmiClassification: BmiClassification.Obese3 }
        },
        {
          followUpType: FollowUpType.Routine,
          followUpReasonText: 'BMI is in the obesity category'
        }
      ],
      [
        'Returns undefined / no follow up for Healthy BMI',
        {
          questionnaireScores: { bmiClassification: BmiClassification.Healthy }
        },
        undefined
      ],
      [
        'Returns undefined / no follow up for Overweight BMI',
        {
          questionnaireScores: {
            bmiClassification: BmiClassification.Overweight
          }
        },
        undefined
      ],
      [
        'Returns undefined / no follow up for Underweight BMI',
        {
          questionnaireScores: {
            bmiClassification: BmiClassification.Underweight
          }
        },
        undefined
      ],
      [
        'Returns undefined / no follow up for null bmiClassification',
        { questionnaireScores: { bmiClassification: null } },
        undefined
      ],
      [
        'Returns undefined / no follow up for missing questionnaireScores',
        {},
        undefined
      ]
    ])('%s', (_desc, input, expected) => {
      const result = service.getBmiFollowUpDetails(input as IHealthCheck);
      if (expected) {
        expect(result).toMatchObject({
          snomedCodes: ['bmi'],
          ...expected
        });
      } else {
        expect(result).toBeUndefined();
      }
    });
  });

  describe('getSmokingFollowUpDetails', () => {
    test.each([
      [
        'Returns routine follow up for when someone spokes up to 9 cigarettes per day',
        { questionnaire: { smoking: Smoking.UpToNinePerDay } },
        {
          followUpType: FollowUpType.Routine,
          followUpReasonText: 'Smokes up to 9 cigarettes a day',
          snomedCodes: ['smokingStatusLightSmoker']
        }
      ],
      [
        'Returns routine follow up for when someone smokes 10 to 19 cigarettes per day',
        { questionnaire: { smoking: Smoking.TenToNineteenPerDay } },
        {
          followUpType: FollowUpType.Routine,
          followUpReasonText: 'Smokes 10 to 19 cigarettes a day',
          snomedCodes: ['smokingStatusModerateSmoker']
        }
      ],
      [
        'Returns routine follow up for when someone smokes 20 or more cigarettes per day',
        { questionnaire: { smoking: Smoking.TwentyOrMorePerDay } },
        {
          followUpType: FollowUpType.Routine,
          followUpReasonText: 'Smokes over 20 cigarettes a day',
          snomedCodes: ['smokingStatusHeavySmoker']
        }
      ],
      [
        'Returns undefined / no follow up for when someone has never smoked',
        { questionnaire: { smoking: Smoking.Never } },
        undefined
      ],
      [
        'Returns undefined / no follow up for when someone has quitted smoking',
        { questionnaire: { smoking: Smoking.Quitted } },
        undefined
      ],
      [
        'Returns undefined / no follow up for undefined smoking',
        { questionnaire: { smoking: undefined } },
        undefined
      ],
      [
        'Returns undefined / no follow up for missing questionnaire',
        {},
        undefined
      ]
    ])('%s', (_desc, input, expected) => {
      const result = service.getSmokingFollowUpDetails(input as IHealthCheck);
      if (expected) {
        expect(result).toMatchObject(expected);
      } else {
        expect(result).toBeUndefined();
      }
    });
  });

  describe('getPhysicalActivityFollowUpDetails', () => {
    test.each([
      [
        'Returns routine follow up for when someone is inactive',
        {
          questionnaireScores: { activityCategory: ActivityCategory.Inactive }
        },
        {
          followUpType: FollowUpType.Routine,
          followUpReasonText: 'Physical activity result is "inactive"'
        }
      ],
      [
        'Returns undefined / no follow up for when someone is active',
        { questionnaireScores: { activityCategory: ActivityCategory.Active } },
        undefined
      ],
      [
        'Returns undefined / no follow up for when someone is moderately active',
        {
          questionnaireScores: {
            activityCategory: ActivityCategory.ModeratelyActive
          }
        },
        undefined
      ],
      [
        'Returns undefined / no follow up for when someone is moderately inactive',
        {
          questionnaireScores: {
            activityCategory: ActivityCategory.ModeratelyInactive
          }
        },
        undefined
      ],
      [
        'Returns undefined / no follow up for null activityCategory',
        { questionnaireScores: { activityCategory: null } },
        undefined
      ],
      [
        'Returns undefined / no follow up for missing questionnaireScores',
        {},
        undefined
      ]
    ])('%s', (_desc, input, expected) => {
      const result = service.getPhysicalActivityFollowUpDetails(
        input as IHealthCheck
      );
      if (expected) {
        expect(result).toMatchObject({
          snomedCodes: ['gppaqScoreInactive'],
          ...expected
        });
      } else {
        expect(result).toBeUndefined();
      }
    });
  });

  describe('getHdlCholesterolFollowUpDetails', () => {
    let getLatestBiometricScoreStub: Sinon.SinonStub;
    beforeEach(() => {
      getLatestBiometricScoreStub = sandbox.stub(
        require('../../../src/lib/utils'),
        'getLatestBiometricScoreFromHealthCheck'
      );
    });
    afterEach(() => {
      getLatestBiometricScoreStub.restore();
    });

    describe('for male', () => {
      test('returns routine follow up for hdlCholesterol just below 1', () => {
        getLatestBiometricScoreStub.returns({
          scores: { cholesterol: { hdlCholesterol: 0.99 } }
        });
        const result = service.getHdlCholesterolFollowUpDetails({
          questionnaire: { sex: Sex.Male }
        } as IHealthCheck);
        expect(result).toMatchObject({
          snomedCodes: ['hdlCholesterol'],
          followUpType: FollowUpType.Routine,
          followUpReasonText: 'HDL cholesterol is below 1mmol/L'
        });
      });
      test('returns undefined / no follow up for hdlCholesterol exactly 1', () => {
        getLatestBiometricScoreStub.returns({
          scores: { cholesterol: { hdlCholesterol: 1 } }
        });
        const result = service.getHdlCholesterolFollowUpDetails({
          questionnaire: { sex: Sex.Male }
        } as IHealthCheck);
        expect(result).toBeUndefined();
      });
      test('returns undefined / no follow up for hdlCholesterol just above 1', () => {
        getLatestBiometricScoreStub.returns({
          scores: { cholesterol: { hdlCholesterol: 1.01 } }
        });
        const result = service.getHdlCholesterolFollowUpDetails({
          questionnaire: { sex: Sex.Male }
        } as IHealthCheck);
        expect(result).toBeUndefined();
      });
      test('returns undefined / no follow up for missing hdlCholesterol', () => {
        getLatestBiometricScoreStub.returns({ scores: { cholesterol: {} } });
        const result = service.getHdlCholesterolFollowUpDetails({
          questionnaire: { sex: Sex.Male }
        } as IHealthCheck);
        expect(result).toBeUndefined();
      });
    });

    describe('for female', () => {
      test('returns routine follow up for hdlCholesterol just below 1.2', () => {
        getLatestBiometricScoreStub.returns({
          scores: { cholesterol: { hdlCholesterol: 1.19 } }
        });
        const result = service.getHdlCholesterolFollowUpDetails({
          questionnaire: { sex: Sex.Female }
        } as IHealthCheck);
        expect(result).toMatchObject({
          snomedCodes: ['hdlCholesterol'],
          followUpType: FollowUpType.Routine,
          followUpReasonText: 'HDL cholesterol is below 1.2mmol/L'
        });
      });
      test('returns undefined / no follow up for hdlCholesterol exactly 1.2', () => {
        getLatestBiometricScoreStub.returns({
          scores: { cholesterol: { hdlCholesterol: 1.2 } }
        });
        const result = service.getHdlCholesterolFollowUpDetails({
          questionnaire: { sex: Sex.Female }
        } as IHealthCheck);
        expect(result).toBeUndefined();
      });
      test('returns undefined / no follow up for hdlCholesterol just above 1.2', () => {
        getLatestBiometricScoreStub.returns({
          scores: { cholesterol: { hdlCholesterol: 1.21 } }
        });
        const result = service.getHdlCholesterolFollowUpDetails({
          questionnaire: { sex: Sex.Female }
        } as IHealthCheck);
        expect(result).toBeUndefined();
      });
      test('returns undefined / no follow up for missing hdlCholesterol', () => {
        getLatestBiometricScoreStub.returns({ scores: { cholesterol: {} } });
        const result = service.getHdlCholesterolFollowUpDetails({
          questionnaire: { sex: Sex.Female }
        } as IHealthCheck);
        expect(result).toBeUndefined();
      });
    });

    describe('with missing sex or cholesterol', () => {
      test('returns undefined / no follow up for missing sex', () => {
        getLatestBiometricScoreStub.returns({
          scores: { cholesterol: { hdlCholesterol: 0.8 } }
        });
        const result = service.getHdlCholesterolFollowUpDetails({
          questionnaire: {}
        } as IHealthCheck);
        expect(result).toBeUndefined();
      });
      test('returns undefined / no follow up for missing cholesterol', () => {
        getLatestBiometricScoreStub.returns({
          scores: {}
        });
        const result = service.getHdlCholesterolFollowUpDetails({
          questionnaire: { sex: Sex.Male }
        } as IHealthCheck);
        expect(result).toBeUndefined();
      });
      test('returns undefined / no follow up for missing biometricScores', () => {
        getLatestBiometricScoreStub.returns(undefined);
        const result = service.getHdlCholesterolFollowUpDetails(
          {} as IHealthCheck
        );
        expect(result).toBeUndefined();
      });
    });
  });

  describe('getTotalCholesterolRatioFollowUpDetails', () => {
    let getLatestBiometricScoreStub: Sinon.SinonStub;
    const testHealthCheck: IHealthCheck = {
      questionnaire: {},
      questionnaireScores: {},
      biometricScores: []
    } as unknown as IHealthCheck;
    beforeEach(() => {
      getLatestBiometricScoreStub = sandbox.stub(
        require('../../../src/lib/utils'),
        'getLatestBiometricScoreFromHealthCheck'
      );
    });
    afterEach(() => {
      getLatestBiometricScoreStub.restore();
    });

    test('returns undefined / no follow up for ratio just below 6', () => {
      getLatestBiometricScoreStub.returns({
        scores: { cholesterol: { totalCholesterolHdlRatio: 5.99 } }
      });
      const result = service.getTotalCholesterolRatioFollowUpDetails({
        ...testHealthCheck
      });
      expect(result).toBeUndefined();
    });
    test('returns undefined / no follow up for ratio exactly 6', () => {
      getLatestBiometricScoreStub.returns({
        scores: { cholesterol: { totalCholesterolHdlRatio: 6 } }
      });
      const result = service.getTotalCholesterolRatioFollowUpDetails({
        ...testHealthCheck
      });
      expect(result).toBeUndefined();
    });
    test('returns routine follow up for ratio just above 6', () => {
      getLatestBiometricScoreStub.returns({
        scores: { cholesterol: { totalCholesterolHdlRatio: 6.01 } }
      });
      const result = service.getTotalCholesterolRatioFollowUpDetails({
        ...testHealthCheck
      });
      expect(result).toMatchObject({
        snomedCodes: ['totalCholesterolRatio'],
        followUpType: FollowUpType.Routine,
        followUpReasonText: 'Total cholesterol to HDL ratio is over 6'
      });
    });
    test('returns undefined / no follow up for missing ratio', () => {
      getLatestBiometricScoreStub.returns({ scores: { cholesterol: {} } });
      const result = service.getTotalCholesterolRatioFollowUpDetails({
        ...testHealthCheck
      });
      expect(result).toBeUndefined();
    });
    test('returns undefined / no follow up for missing biometricScores', () => {
      getLatestBiometricScoreStub.returns(undefined);
      const result = service.getTotalCholesterolRatioFollowUpDetails({
        ...testHealthCheck
      });
      expect(result).toBeUndefined();
    });
  });

  describe('getFailedBiometricResultsFollowUpDetails', () => {
    test('returns undefined when there are no failures', () => {
      const input = {
        biometricScores: [
          {
            scores: {
              cholesterol: {},
              diabetes: { overallCategory: undefined }
            }
          }
        ]
      };
      const result = service.getFailedBiometricResultsFollowUpDetails(
        input as unknown as IHealthCheck
      );
      expect(result).toBeUndefined();
    });

    test('returns routine follow up with correct codes', () => {
      const input = {
        biometricScores: [
          {
            scores: {
              cholesterol: {
                totalCholesterolFailureReason: 'error',
                hdlCholesterolFailureReason: 'error',
                totalCholesterolHdlRatioFailureReason: 'error',
                overallCategory: OverallCholesterolCategory.CompleteFailure
              },
              diabetes: {
                failureReason: 'error',
                overallCategory: OverallDiabetesCategory.PartialFailure
              }
            }
          }
        ]
      };
      const result = service.getFailedBiometricResultsFollowUpDetails(
        input as unknown as IHealthCheck
      );
      expect(result).toMatchObject({
        snomedCodes: [
          'cholesterol',
          'hdlCholesterol',
          'totalCholesterolRatio',
          'hba1cDiabetes'
        ],
        followUpType: FollowUpType.Routine,
        followUpReasonText: undefined
      });
    });

    test('returns undefined for missing biometricScores', () => {
      const input = {};
      const result = service.getFailedBiometricResultsFollowUpDetails(
        input as unknown as IHealthCheck
      );
      expect(result).toBeUndefined();
    });
  });
});
