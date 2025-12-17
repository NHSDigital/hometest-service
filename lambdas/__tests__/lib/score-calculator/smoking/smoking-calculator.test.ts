import {
  type IHealthCheckAnswers,
  Smoking,
  SmokingCategory
} from '@dnhc-health-checks/shared';
import calculateSmokingCategory from '../../../../src/lib/score-calculator/smoking/smoking-calculator';

describe('calculateSmokingCategory', () => {
  const testCases = [
    { smoking: Smoking.Never, expectedCategory: SmokingCategory.NeverSmoked },
    { smoking: Smoking.Quitted, expectedCategory: SmokingCategory.ExSmoker },
    {
      smoking: Smoking.UpToNinePerDay,
      expectedCategory: SmokingCategory.CurrentSmoker
    },
    {
      smoking: Smoking.TenToNineteenPerDay,
      expectedCategory: SmokingCategory.CurrentSmoker
    },
    {
      smoking: Smoking.TwentyOrMorePerDay,
      expectedCategory: SmokingCategory.CurrentSmoker
    },
    {
      smoking: undefined,
      expectedCategory: null
    }
  ];

  test.each(testCases)(
    'should return $expectedCategory for smoking status $smoking',
    ({ smoking, expectedCategory }) => {
      const healthCheckAnswers: IHealthCheckAnswers = {
        smoking
      } as unknown as IHealthCheckAnswers;
      const result = calculateSmokingCategory(healthCheckAnswers);
      expect(result).toBe(expectedCategory);
    }
  );
});
