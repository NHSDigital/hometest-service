import { test } from '../../fixtures';
import { HIVTestResultData } from '../../test-data/HIVTestResultData';
import { headersTestResults } from '../../test-data/HeadersTestResults';

test.describe('Submit Test Result API', () => {
  test('should successfully submit HIV test results and return 201', async ({ hivResultsApi }) => {
    const testData = HIVTestResultData.getDefaultResult();
    const headers = headersTestResults;
    const response = await hivResultsApi.submitTestResults(testData, headers);

    hivResultsApi.validateResponse(response, 201);

    const _result = await response.json();
  });
});
