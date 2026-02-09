import { test, expect } from '../../fixtures';
import { HIVTestResultData } from '../../test-data/HIVTestResultData';
import { headersTestResults } from '../../test-data/HeadersTestResults';

test.describe('Submit Test Result API', () => {
  test('should successfully submit HIV test results and return 201', async ({ hivResultsApi }) => {
    const testData = HIVTestResultData.getDefaultResult();
    const headers = headersTestResults;
    const result = await hivResultsApi.submitTestResults(testData, headers);
  });
});
