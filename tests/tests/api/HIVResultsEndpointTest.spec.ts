import { expect } from '@playwright/test';
import { test } from '../../fixtures/CombinedTestFixture';
import { HIVTestResultData } from '../../test-data/HIVTestResultData';
import { headersTestResults } from '../../utils/ApiRequestHelper';

test.describe('Backend API, results endpoint', () => {
  test(
    'POST request, should successfully submit HIV test results and return 201',
    { tag: ['@api'] },
    async ({ hivResultsApi }) => {
      const testData = HIVTestResultData.getDefaultResult();
      const response = await hivResultsApi.submitTestResults(
        testData,
        headersTestResults
      );
      expect(response.status()).toBe(201);
    }
  );
});
