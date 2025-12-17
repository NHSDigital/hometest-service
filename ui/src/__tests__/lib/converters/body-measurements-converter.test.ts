import {
  convertFtToCm,
  convertCmToFtAndInches,
  convertCmToInches,
  convertInchesToCm,
  convertKgToLbsAndStones,
  convertLbsAndStonesToKg
} from '../../../lib/converters/body-measurements-converter';

describe('convertFtToCm tests', () => {
  it.each([
    [5, 8, 172.72],
    [6, 0, 182.88],
    [undefined, null, null],
    [null, null, null],
    [null, 5, null],
    [5, null, 152.4],
    [5, 3, 160.02]
  ])(
    'should correctly convert %p ft and %d inches to cm',
    (ft, inch, expected) => {
      expect(convertFtToCm(ft, inch)).toEqual(expected);
    }
  );
});

describe('convertCmToFtAndInches tests', () => {
  it.each([
    [172.72, { ft: 5, inch: 8 }],
    [182.88, { ft: 6, inch: 0 }],
    [undefined, { ft: null, inch: null }],
    [null, { ft: null, inch: null }],
    [150, { ft: 4, inch: 11 }],
    [200, { ft: 6, inch: 7 }]
  ])('should correctly convert %p cm to feet and inches', (cm, expected) => {
    expect(convertCmToFtAndInches(cm)).toEqual(expected);
  });
});

describe('convertCmToInches tests', () => {
  it.each([
    [172.72, 68],
    [182.88, 72],
    [null, null],
    [150, 59.06],
    [200, 78.74]
  ])('should correctly convert %p cm to inches', (cm, expected) => {
    expect(convertCmToInches(cm)).toEqual(expected);
  });
});

describe('convertInchesToCm tests', () => {
  it.each([
    [68, 172.72],
    [72, 182.88],
    [null, null],
    [59.06, 150.01],
    [78.74, 200]
  ])('should correctly convert %p inches to cm', (inches, expected) => {
    expect(convertInchesToCm(inches)).toEqual(expected);
  });
});

describe('convertKgToLbsAndStones tests', () => {
  it.each([
    [70, { stones: 11, pounds: 0 }],
    [90, { stones: 14, pounds: 2 }],
    [undefined, { stones: null, pounds: null }],
    [null, { stones: null, pounds: null }],
    [50, { stones: 7, pounds: 12 }],
    [120, { stones: 18, pounds: 13 }]
  ])('should correctly convert %p kg to stones and pounds', (kg, expected) => {
    expect(convertKgToLbsAndStones(kg)).toEqual(expected);
  });
});

describe('convertLbsAndStonesToKg tests', () => {
  it.each([
    [11, 0, 69.85],
    [14, 2, 89.81],
    [undefined, null, null],
    [null, null, null],
    [7, 12, 49.9],
    [18, 12, 119.75]
  ])(
    'should correctly convert %p stones and %d pounds to kg',
    (stones, pounds, expected) => {
      expect(convertLbsAndStonesToKg(stones, pounds)).toEqual(expected);
    }
  );
});
