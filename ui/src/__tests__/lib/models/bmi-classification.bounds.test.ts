import { BmiClassificationBounds } from '../../../lib/models/bmi-classification-bounds';
import { EthnicBackground } from '@dnhc-health-checks/shared';

describe('BmiClassificationBounds', () => {
  const whiteOtherEthnicClassificationBound = {
    underweight: { value: 18.5, label: '18.4' },
    healthy: { value: 25, label: '24.9' },
    overweight: { value: 30, label: '29.9' },
    obese1: { value: 35, label: '34.9' },
    obese2: { value: 40, label: '39.9' },
    obese3: { value: Infinity, label: '40+' }
  };
  test('returns correct bounds for White ethnic background', () => {
    const bounds = BmiClassificationBounds.getClassificationBounds(
      EthnicBackground.White
    );
    expect(bounds.lower).toBe(0);
    expect(bounds.upper).toEqual(whiteOtherEthnicClassificationBound);
  });

  test('returns correct bounds for Other ethnic background', () => {
    const bounds = BmiClassificationBounds.getClassificationBounds(
      EthnicBackground.Other
    );
    expect(bounds.lower).toBe(0);
    expect(bounds.upper).toEqual(whiteOtherEthnicClassificationBound);
  });

  test('returns correct bounds for non-White and non-Other ethnic backgrounds', () => {
    const bounds = BmiClassificationBounds.getClassificationBounds(
      EthnicBackground.AsianOrAsianBritish
    );
    expect(bounds.lower).toBe(0);
    expect(bounds.upper).toEqual({
      underweight: { value: 18.5, label: '18.4' },
      healthy: { value: 23, label: '22.9' },
      overweight: { value: 27.5, label: '27.4' },
      obese1: { value: 32.5, label: '32.4' },
      obese2: { value: 37.5, label: '37.4' },
      obese3: { value: Infinity, label: '40+' }
    });
  });
});
