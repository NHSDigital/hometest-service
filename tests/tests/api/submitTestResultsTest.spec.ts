import { test } from '../../fixtures';
import { HIVTestResultData } from '../../test-data/HIVTestResultData';
import { createHeadersTestResults } from '../../test-data/HeadersTestResults';

test.describe('Submit Test Result API', () => {
  test('should successfully submit HIV test results and return 201', async ({ hivResultsApi }) => {
    const testData = HIVTestResultData.getDefaultResult();
    const correlationId = "123e4567-e89b-12d3-a456-426614174999" ;
    const headers = createHeadersTestResults(correlationId);
    const response = await hivResultsApi.submitTestResults(testData, headers);
    hivResultsApi.validateResponse(response, 201);
  });
});
