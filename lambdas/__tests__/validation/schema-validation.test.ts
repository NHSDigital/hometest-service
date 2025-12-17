import { Commons } from '../../src/lib/commons';
import {
  AlcoholEventsFrequency,
  AsianOrAsianBritish,
  BlackAfricanCaribbeanOrBlackBritish,
  EthnicBackground,
  BloodPressureLocation,
  MixedOrMultipleGroups,
  OtherEthnicity,
  WhiteEthnicBackground,
  ParentSiblingHeartAttack,
  ParentSiblingChildDiabetes,
  Sex,
  Smoking,
  AlcoholPersonInjuredAndConcernedRelative,
  HeightDisplayPreference,
  WeightDisplayPreference,
  WaistMeasurementDisplayPreference,
  EthnicBackgroundOther
} from '@dnhc-health-checks/shared';
import {
  SchemaValidationService,
  ValidatorType
} from '../../src/lib/validation/schema-validator';

describe('Schema validation tests', () => {
  const commons = new Commons('test', 'test');
  const schemaValidationService = new SchemaValidationService(commons);

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('About you', () => {
    test.each([
      [
        EthnicBackground.AsianOrAsianBritish,
        Object.values(AsianOrAsianBritish)
          .map((element) => element.toString())
          .concat(
            Object.values(EthnicBackgroundOther).map((element) =>
              element.toString()
            )
          )
      ],
      [
        EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
        Object.values(BlackAfricanCaribbeanOrBlackBritish)
          .map((element) => element.toString())
          .concat(
            Object.values(EthnicBackgroundOther).map((element) =>
              element.toString()
            )
          )
      ],
      [
        EthnicBackground.MixedOrMultipleGroups,
        Object.values(MixedOrMultipleGroups)
          .map((element) => element.toString())
          .concat(
            Object.values(EthnicBackgroundOther).map((element) =>
              element.toString()
            )
          )
      ],
      [
        EthnicBackground.White,
        Object.values(WhiteEthnicBackground)
          .map((element) => element.toString())
          .concat(
            Object.values(EthnicBackgroundOther).map((element) =>
              element.toString()
            )
          )
      ],
      [
        EthnicBackground.Other,
        Object.values(OtherEthnicity)
          .map((element) => element.toString())
          .concat(
            Object.values(EthnicBackgroundOther).map((element) =>
              element.toString()
            )
          )
      ]
    ])(
      'When ethnic group is "%s" then "%s" should be allowed as detailed ethnic group',
      (ethnicBackground: string, answers: string[]) => {
        answers.forEach((answer) => {
          const result = schemaValidationService.validateObject(
            {
              ethnicBackground,
              detailedEthnicGroup: answer
            },
            ValidatorType.Questionnaire
          );
          expect(result.isValid).toBeTruthy();
        });
      }
    );

    test.each(Object.values(EthnicBackground).map((element) => [element]))(
      'When ethnic group is "%s" then should NOT allow random value',
      (ethnicBackground: string) => {
        const result = schemaValidationService.validateObject(
          {
            ethnicBackground,
            detailedEthnicGroup: 'foobar'
          },
          ValidatorType.Questionnaire
        );
        expect(result.isValid).toBeFalsy();
      }
    );

    test.each([
      [ParentSiblingHeartAttack.No, true],
      [ParentSiblingHeartAttack.Unknown, true],
      [ParentSiblingHeartAttack.Yes, true],
      [undefined, true],
      ['invalid value', false],
      ['', false],
      [null, true]
    ])(
      'should validate correct and reject incorrect hasFamilyHeartAttackHistory options',
      (
        hasHeartAttackHistory: string | undefined | null,
        expectedResult: boolean
      ) => {
        const result = schemaValidationService.validateObject(
          { hasFamilyHeartAttackHistory: hasHeartAttackHistory },
          ValidatorType.Questionnaire
        );

        expect(result.isValid).toBe(expectedResult);
      }
    );

    test.each([
      [ParentSiblingChildDiabetes.No, true],
      [ParentSiblingChildDiabetes.Unknown, true],
      [ParentSiblingChildDiabetes.Yes, true],
      [undefined, true],
      ['invalid value', false],
      ['', false],
      [null, true]
    ])(
      'should validate correct and reject incorrect hasFamilyDiabetesHistory options',
      (
        hasDiabetesHistory: string | undefined | null,
        expectedResult: boolean
      ) => {
        const result = schemaValidationService.validateObject(
          { hasFamilyDiabetesHistory: hasDiabetesHistory },
          ValidatorType.Questionnaire
        );

        expect(result.isValid).toBe(expectedResult);
      }
    );

    test.each([
      [Sex.Male, true],
      [Sex.Female, true],
      [undefined, true],
      ['invalid value', false],
      ['', false],
      [null, true]
    ])(
      'should validate correct and reject incorrect sex options',
      (answer: string | undefined | null, expectedResult: boolean) => {
        const result = schemaValidationService.validateObject(
          { sex: answer },
          ValidatorType.Questionnaire
        );

        expect(result.isValid).toBe(expectedResult);
      }
    );

    test.each([
      [Smoking.TenToNineteenPerDay, true],
      [Smoking.TwentyOrMorePerDay, true],
      [Smoking.Never, true],
      [Smoking.Quitted, true],
      [Smoking.UpToNinePerDay, true],
      [undefined, true],
      ['invalid value', false],
      ['', false],
      [null, true]
    ])(
      'should validate correct and reject incorrect smoking options',
      (answer: string | undefined | null, expectedResult: boolean) => {
        const result = schemaValidationService.validateObject(
          { smoking: answer },
          ValidatorType.Questionnaire
        );

        expect(result.isValid).toBe(expectedResult);
      }
    );

    test.each([
      [AlcoholPersonInjuredAndConcernedRelative.No, true],
      [AlcoholPersonInjuredAndConcernedRelative.YesNotPastYear, true],
      [AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear, true],
      [undefined, true],
      ['invalid value', false],
      ['', false],
      [null, true]
    ])(
      'should validate correct and reject incorrect alcoholPersonInjured options',
      (answer: string | undefined | null, expectedResult: boolean) => {
        const result = schemaValidationService.validateObject(
          { alcoholPersonInjured: answer },
          ValidatorType.Questionnaire
        );

        expect(result.isValid).toBe(expectedResult);
      }
    );
  });

  describe('Blood Pressure', () => {
    test.each([
      [BloodPressureLocation.Monitor, true],
      [BloodPressureLocation.Pharmacy, true],
      [undefined, true],
      ['invalid value', false],
      ['', false],
      [null, true]
    ])(
      'should validate correct and reject incorrect bloodPressureLocation options',
      (location: string | undefined | null, expectedResult: boolean) => {
        const result = schemaValidationService.validateObject(
          { bloodPressureLocation: location },
          ValidatorType.Questionnaire
        );

        expect(result.isValid).toBe(expectedResult);
      }
    );

    test.each([
      // [systolic, diastolic, expectedResult]
      [120, 80, true],
      [70, 40, true],
      [300, 200, true],
      [301, 200, false],
      [300, 201, false],
      [69, 40, false],
      [70, 39, false],
      [70, 39.999999, false],
      [-300, -200, false],
      [120, 80.5, false],
      [120.5, 80, false],
      [100, 100, false],
      [90, 100, false],
      [undefined, undefined, true],
      [null, null, true],
      ['invalid', 50, false],
      [100, 'invalid', false]
    ])(
      'should validate blood pressure values - systolic: "%s", diastolic: "%s", expected: "%s"',
      (systolic: any, diastolic: any, expectedResult: boolean) => {
        const result = schemaValidationService.validateObject(
          {
            bloodPressureSystolic: systolic,
            bloodPressureDiastolic: diastolic
          },
          ValidatorType.Questionnaire
        );

        expect(result.isValid).toBe(expectedResult);
      }
    );
  });

  describe('Alcohol', () => {
    test.each([
      ...Object.values(AlcoholEventsFrequency).map(
        (element) => element as string
      ),
      null
    ])(
      'When alcohol frequency answer is "%s" then object should be valid',
      (alcoholAnswer: string | null) => {
        const result = schemaValidationService.validateObject(
          {
            alcoholFailedObligations: alcoholAnswer
          },
          ValidatorType.Questionnaire
        );
        expect(result.isValid).toBeTruthy();
      }
    );

    test.each([[''], ['testString']])(
      'When alcohol frequency answer is "%s" then object should NOT be valid',
      (alcoholAnswer: string) => {
        const result = schemaValidationService.validateObject(
          {
            alcoholFailedObligations: alcoholAnswer
          },
          ValidatorType.Questionnaire
        );
        expect(result.isValid).toBeFalsy();
      }
    );

    test.each([
      [AlcoholEventsFrequency.DailyOrAlmost, true],
      [AlcoholEventsFrequency.LessThanMonthly, true],
      [AlcoholEventsFrequency.Never, true],
      [AlcoholEventsFrequency.Monthly, true],
      [AlcoholEventsFrequency.Weekly, true],
      [undefined, true],
      ['invalid value', false],
      ['', false],
      [null, true]
    ])(
      'should validate correct and reject incorrect alcoholGuilt options',
      (frequency: string | undefined | null, expectedResult: boolean) => {
        const result = schemaValidationService.validateObject(
          { alcoholGuilt: frequency },
          ValidatorType.Questionnaire
        );

        expect(result.isValid).toBe(expectedResult);
      }
    );

    test.each([
      [AlcoholEventsFrequency.DailyOrAlmost, true],
      [AlcoholEventsFrequency.LessThanMonthly, true],
      [AlcoholEventsFrequency.Never, true],
      [AlcoholEventsFrequency.Monthly, true],
      [AlcoholEventsFrequency.Weekly, true],
      [undefined, true],
      ['invalid value', false],
      ['', false],
      [null, true]
    ])(
      'should validate correct and reject incorrect alcoholMemoryLoss options',
      (frequency: string | undefined | null, expectedResult: boolean) => {
        const result = schemaValidationService.validateObject(
          { alcoholMemoryLoss: frequency },
          ValidatorType.Questionnaire
        );

        expect(result.isValid).toBe(expectedResult);
      }
    );
  });

  test.each([
    [AlcoholPersonInjuredAndConcernedRelative.No, true],
    [AlcoholPersonInjuredAndConcernedRelative.YesNotPastYear, true],
    [AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear, true],
    [undefined, true],
    ['', false],
    [null, true],
    ['testString', false]
  ])(
    'should validate correct and reject incorrect alcoholConcernedRelative answers',
    (answer: string | undefined | null, expectedResult: boolean) => {
      const result = schemaValidationService.validateObject(
        {
          alcoholConcernedRelative: answer
        },
        ValidatorType.Questionnaire
      );
      expect(result.isValid).toBe(expectedResult);
    }
  );

  describe('Body measurements', () => {
    test.each([
      [null, true],
      ['invalid', false],
      [139.6, false],
      [243.9, false],
      [243.8, true],
      [139.7, true],
      [undefined, true]
    ])(
      'should validate height value "%s" as expected result "%s"',
      (answer: any, expectedResult: boolean) => {
        const result = schemaValidationService.validateObject(
          {
            height: answer
          },
          ValidatorType.Questionnaire
        );

        expect(result.isValid).toBe(expectedResult);
      }
    );

    test.each([
      [null, true],
      ['invalid', false],
      [25.3, false],
      [317.6, false],
      [25.4, true],
      [317.5, true],
      [undefined, true]
    ])(
      'should validate weight value "%s" as expected result "%s"',
      (answer: any, expectedResult: boolean) => {
        const result = schemaValidationService.validateObject(
          {
            weight: answer
          },
          ValidatorType.Questionnaire
        );

        expect(result.isValid).toBe(expectedResult);
      }
    );

    test.each([
      [null, true],
      ['invalid', false],
      [35.5, false],
      [304.9, false],
      [35.6, true],
      [304.8, true],
      [undefined, true]
    ])(
      'should validate waist measurement value "%s" as expected result "%s"',
      (answer: any, expectedResult: boolean) => {
        const result = schemaValidationService.validateObject(
          {
            waistMeasurement: answer
          },
          ValidatorType.Questionnaire
        );

        expect(result.isValid).toBe(expectedResult);
      }
    );

    test.each([
      [HeightDisplayPreference.Centimetres, true],
      [HeightDisplayPreference.FeetAndInches, true],
      [undefined, true],
      ['invalid', false],
      [null, true]
    ])(
      'should validate heightDisplayPreference value "%s" as expected result "%s"',
      (answer: any, expectedResult: boolean) => {
        const result = schemaValidationService.validateObject(
          {
            heightDisplayPreference: answer
          },
          ValidatorType.Questionnaire
        );

        expect(result.isValid).toBe(expectedResult);
      }
    );

    test.each([
      [WeightDisplayPreference.Kilograms, true],
      [WeightDisplayPreference.StonesAndPounds, true],
      [undefined, true],
      ['invalid', false],
      [null, true]
    ])(
      'should validate weightDisplayPreference value "%s" as expected result "%s"',
      (answer: any, expectedResult: boolean) => {
        const result = schemaValidationService.validateObject(
          {
            weightDisplayPreference: answer
          },
          ValidatorType.Questionnaire
        );

        expect(result.isValid).toBe(expectedResult);
      }
    );

    test.each([
      [WaistMeasurementDisplayPreference.Centimetres, true],
      [WaistMeasurementDisplayPreference.Inches, true],
      [undefined, true],
      ['invalid', false],
      [null, true]
    ])(
      'should validate waistMeasurementDisplayPreference value "%s" as expected result "%s"',
      (answer: any, expectedResult: boolean) => {
        const result = schemaValidationService.validateObject(
          {
            waistMeasurementDisplayPreference: answer
          },
          ValidatorType.Questionnaire
        );

        expect(result.isValid).toBe(expectedResult);
      }
    );
  });

  describe('Blood test order', () => {
    test.each([
      [
        'Should pass for valid form',
        'Elton Road',
        '5 flat 11',
        'Greater London',
        'London',
        'BS2 8ST',
        true
      ],
      [
        'Fails if address line is empty',
        '',
        '5 flat 11',
        'Greater London',
        'London',
        'BS2 8ST',
        false
      ],
      [
        'Fails if town is empty',
        'Elton Road',
        '5 flat 11',
        'Greater London',
        '',
        'BS2 8ST',
        false
      ],
      [
        'Fails if postcode is empty',
        'Elton Road',
        '5 flat 11',
        'Greater London',
        'London',
        '',
        false
      ],
      [
        'Fails if postcode is too short',
        'Elton Road',
        '5 flat 11',
        'Greater London',
        'London',
        'BS2 8S',
        false
      ],
      [
        'Fails if postcode is invalid',
        'Elton Road',
        '5 flat 11',
        'Greater London',
        'London',
        'ABC 123',
        false
      ],
      [
        'Passes with empty addressLine2 and addressLine3',
        'Elton Road',
        '',
        '',
        'London',
        'BS2 8ST',
        true
      ],
      [
        'Fails with too long addressLine1',
        'Elton RoadRoadRoadRoad',
        '5 flat 11',
        'Greater London',
        'London',
        'BS2 8ST',
        false
      ],
      [
        'Fails with too long addressLine2',
        'Elton Road',
        '5 flat 1111111111111111',
        'Greater London',
        'London',
        'BS2 8ST',
        false
      ],
      [
        'Fails with too long addressLine3',
        'Elton Road',
        '5 flat 11',
        'Greater LondonLondonLondonLondon',
        'London',
        'BS2 8ST',
        false
      ],
      [
        'Fails with too long town',
        'Elton Road',
        '5 flat 11',
        'Greater London',
        'LondonLondonLondonLondonLondon',
        'BS2 8ST',
        false
      ],
      [
        'Fails with too long addressLine1 after escaping chars',
        'Elton RoadRoadRoadR<',
        '5 flat 11',
        'Greater London',
        'London',
        'BS2 8ST',
        false
      ],
      [
        'Fails with too long addressLine2 after escaping chars',
        'Elton Road',
        '5 flat 111111111111>',
        'Greater London',
        'London',
        'BS2 8ST',
        false
      ],
      [
        'Fails with too long addressLine3 after escaping chars',
        'Elton Road',
        '5 flat 11',
        'Greater LondonLondo&',
        'London',
        'BS2 8ST',
        false
      ],
      [
        'Fails with too long town after escaping chars',
        'Elton Road',
        '5 flat 11',
        'Greater London',
        'LondonLondonLondonL"',
        'BS2 8ST',
        false
      ]
    ])(
      'should validate blood test order values - "%s"',
      (
        failureReason: string,
        addressLine1: any,
        addressLine2: any,
        addressLine3: any,
        townCity: any,
        postcode: any,
        expectedResult: boolean
        // eslint-disable-next-line max-params
      ) => {
        const result = schemaValidationService.validateObject(
          {
            address: {
              addressLine1,
              addressLine2,
              addressLine3,
              townCity,
              postcode
            },
            isBloodTestSectionSubmitted: false
          },
          ValidatorType.BloodTestOrder
        );

        expect(result.isValid).toBe(expectedResult);
      }
    );
  });

  describe('Blood test order search params', () => {
    test.each([
      ['Should pass for valid form', 'BS2 8ST', '15', true],
      ['Fails if postcode is empty', '', '15', false],
      ['Fails if postcode is too short', 'BS2 8S', '15', false],
      ['Fails if postcode is invalid', 'ABC 123', '15', false],
      ['Passes with empty buildingNumber', 'BS2 8ST', '', true],
      [
        'Fails with too long buildingNumber',
        'BS2 8ST',
        'too long 123444345555455445',
        false
      ],
      [
        'Fails with too long buildingNumber after escaping chars',
        'BS2 8ST',
        'too long 123444345<>',
        false
      ]
    ])(
      'should validate blood test order values - "%s"',
      (
        failureReason: string,
        postcode: any,
        buildingNumber: any,
        expectedResult: boolean
      ) => {
        const result = schemaValidationService.validateObject(
          {
            searchParams: {
              postcode,
              buildingNumber
            },
            isBloodTestSectionSubmitted: false
          },
          ValidatorType.BloodTestOrder
        );

        expect(result.isValid).toBe(expectedResult);
      }
    );
  });
});
