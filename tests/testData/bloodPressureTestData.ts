const systolicTooLowValueError = 'Error: Systolic reading must be 70 or above';
const systolicTooHighValueError =
  'Error: Systolic reading must be 300 or below';
const systolicWholeNumberError =
  'Error: Systolic reading must be a whole number';
const diastolicTooLowValueError =
  'Error: Diastolic reading must be 40 or above';
const diastolicTooHighValueError =
  'Error: Diastolic reading must be 200 or below';
const diastolicWholeNumberError =
  'Error: Diastolic reading must be a whole number';
const diastolicShouldBeLowerThanSystolicError =
  'Error: Diastolic reading should be lower than your systolic reading';

export const systolicIncorrectValues = [
  {
    value: 0,
    expectedErrorMessage: systolicTooLowValueError
  },
  {
    value: -1,
    expectedErrorMessage: systolicTooLowValueError
  },
  {
    value: 69,
    expectedErrorMessage: systolicTooLowValueError
  },
  {
    value: 301,
    expectedErrorMessage: systolicTooHighValueError
  },
  {
    value: 999999999,
    expectedErrorMessage: systolicTooHighValueError
  },
  {
    value: 90.2,
    expectedErrorMessage: systolicWholeNumberError
  }
];

export const diastolicIncorrectValues = [
  {
    value: 0,
    expectedErrorMessage: diastolicTooLowValueError
  },
  {
    value: -1,
    expectedErrorMessage: diastolicTooLowValueError
  },
  {
    value: 39,
    expectedErrorMessage: diastolicTooLowValueError
  },
  {
    value: 201,
    expectedErrorMessage: diastolicTooHighValueError
  },
  {
    value: 999999999,
    expectedErrorMessage: diastolicTooHighValueError
  },
  {
    value: 80.8,
    expectedErrorMessage: diastolicWholeNumberError
  }
];

export const diastolicHigherThanSystolicValues = [
  {
    systolicValue: 90,
    diastolicValue: 90,
    expectedErrorMessage: diastolicShouldBeLowerThanSystolicError
  },
  {
    systolicValue: 90,
    diastolicValue: 91,
    expectedErrorMessage: diastolicShouldBeLowerThanSystolicError
  }
];

export const systolicAndDiastolicIncorrect = [
  {
    systolicValue: 400,
    diastolicValue: 400,
    expectedSystolicErrorMessage: systolicTooHighValueError,
    expectedDiastolicErrorMessage: diastolicTooHighValueError
  },
  {
    systolicValue: 2,
    diastolicValue: 1,
    expectedSystolicErrorMessage: systolicTooLowValueError,
    expectedDiastolicErrorMessage: diastolicTooLowValueError
  }
];
