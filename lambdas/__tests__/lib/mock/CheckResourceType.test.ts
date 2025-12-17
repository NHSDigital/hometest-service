import { checkResourceType } from '../../../src/lib/mock/CheckResourceType';

test('Encounter will return true', async () => {
  const result = checkResourceType('Encounter');
  expect(result).toBe(true);
});

test('Observation will return true', async () => {
  const result = checkResourceType('Observation');
  expect(result).toBe(true);
});

test('RiskAssessment will return true', async () => {
  const result = checkResourceType('RiskAssessment');
  expect(result).toBe(true);
});

test('incorrect case will return false', async () => {
  const result = checkResourceType('observation');
  expect(result).toBe(false);
});

test('empty string will return false', async () => {
  const result = checkResourceType('');
  expect(result).toBe(false);
});
