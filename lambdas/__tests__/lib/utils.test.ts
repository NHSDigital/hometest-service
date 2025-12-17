import {
  OverallCholesterolCategory,
  type ICholesterolScore,
  Smoking,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import {
  calculateAge,
  getHealthCheckState,
  hasAnyFailedOverallCholesterolCategory,
  mapSmokingStatusToSnomedCodeId,
  titleCase,
  validateUrlSource
} from '../../src/lib/utils';

const mockDate = new Date('2024-05-01');
jest.useFakeTimers().setSystemTime(mockDate);

interface CalculateAgeModel {
  dateOfBirth: string;
  expectedAge: number;
}

describe('utils', () => {
  describe('calculateAge', () => {
    const calculateAgeInput: CalculateAgeModel[] = [
      { dateOfBirth: '2000-01-01', expectedAge: 24 },
      { dateOfBirth: '2000-04-20', expectedAge: 24 },
      { dateOfBirth: '2000-05-01', expectedAge: 24 },
      { dateOfBirth: '2000-06-01', expectedAge: 23 }
    ];

    test.each(calculateAgeInput)(
      'should calculate age correctly for %s',
      async (testData: CalculateAgeModel) => {
        const date = new Date(testData.dateOfBirth);
        const age = calculateAge(date);
        expect(age).toEqual(testData.expectedAge);
      }
    );
  });

  describe('titleCase', () => {
    test.each([
      ['some', 'Some'],
      ['sOMe', 'Some'],
      ['SOME', 'Some'],
      ['SOME 12 tExT', 'Some 12 Text'],
      ['123', '123'],
      ['123abc', '123ABC'],
      ['123abc text', '123ABC Text'],
      ['some-TEXT', 'Some-Text'],
      ['UK', 'UK'],
      ['NHS', 'NHS']
    ])(
      'should title %s correctly to %s',
      async (input: string, expectedTitleCase: string) => {
        expect(titleCase(input)).toEqual(expectedTitleCase);
      }
    );
  });

  describe('hasAnyFailedOverallCholesterolCategory', () => {
    test.each([
      [{ overallCategory: OverallCholesterolCategory.PartialFailure }, true],
      [{ overallCategory: OverallCholesterolCategory.CompleteFailure }, true],
      [{ overallCategory: OverallCholesterolCategory.High }, false],
      [{ overallCategory: OverallCholesterolCategory.AtRisk }, false],
      [undefined, false]
    ])(
      'should return true/false correctly',
      async (
        cholesterol: ICholesterolScore | undefined,
        expectedResult: boolean
      ) => {
        expect(hasAnyFailedOverallCholesterolCategory(cholesterol)).toEqual(
          expectedResult
        );
      }
    );
  });

  describe('mapSmokingStatusToSnomedCodeId', () => {
    test.each([
      [Smoking.Quitted, 'smokingStatusExSmoker'],
      [Smoking.TwentyOrMorePerDay, 'smokingStatusHeavySmoker'],
      [Smoking.UpToNinePerDay, 'smokingStatusLightSmoker'],
      [Smoking.TenToNineteenPerDay, 'smokingStatusModerateSmoker'],
      [Smoking.Never, 'smokingStatusNonSmoker'],
      [undefined, undefined]
    ])(
      'should return snomed code id correctly',
      async (
        smokingStatus: Smoking | undefined,
        expectedResult: string | undefined
      ) => {
        expect(mapSmokingStatusToSnomedCodeId(smokingStatus)).toEqual(
          expectedResult
        );
      }
    );
  });

  describe('validateUrlSource', () => {
    test.each([
      [undefined, undefined],
      ['', undefined],
      [' ', undefined],
      ['!', undefined],
      ['A', undefined],
      ['ABC', undefined],
      ['1A', undefined],
      ['A1', undefined],
      ['A$', undefined],
      ['AB', 'AB'],
      ['ab', 'AB'],
      [' aB ', 'AB']
    ])(
      'should return expected url source - %s as %s',
      async (
        urlSource: string | undefined,
        expectedResult: string | undefined
      ) => {
        expect(validateUrlSource(urlSource)).toEqual(expectedResult);
      }
    );
  });

  describe('getHealthCheckState tests', () => {
    it("should return 'incompleteHealthCheck' if isPartial is true", () => {
      const healthCheck = {
        biometricScores: [{}]
      } as IHealthCheck;
      const result = getHealthCheckState(healthCheck, true);
      expect(result).toBe('incompleteHealthCheck');
    });

    it("should return 'incompleteHealthCheck' if cholesterol overallCategory is PartialFailure", () => {
      const healthCheck = {
        biometricScores: [
          {
            date: '2024-04-01',
            scores: {
              cholesterol: {
                overallCategory: OverallCholesterolCategory.PartialFailure
              }
            }
          }
        ]
      } as IHealthCheck;
      const result = getHealthCheckState(healthCheck, false);
      expect(result).toBe('incompleteHealthCheck');
    });
  });
});
