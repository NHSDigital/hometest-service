import { test } from '../../../fixtures/commonFixture';
import bloodPressureShutterScreenJourneyTests from './bloodPressureShutterScreenJourney';
import bloodTestExpiryWriteBackTest from './bloodTestExpiryWriteBackTest';
import fullyExpiryAfterBloodTestOrderAndWriteBackTest from './fullExpiryAfterBloodTestAndWriteBackToGP';
import healthCheckExpiresAfterOrderingBloodTest from './healthCheckExpiresAfterOrderingBloodTest';
import initAutoExpiryLambdaTests from './initAutoExpiryLambda';
import labResultsReceivedAfterHealthCheckExpires from './labResultsReceivedAfterHealthCheckExpires';
import partialWriteBackIntegrationTest from './partialWriteBackIntegrationTest';
import partialWriteBackLambdaTest from './partialWriteBackLambdaTest';
import pdmIntegrationTest from './pdmIntegrationTest';
import questionnaireExpiresWithoutBloodOrderTest from './questionareExpiresWithoutBloodOrderTest';
import streamingExpiredHealthCheckTest from './streamingExpiredHealthcheck';

test.describe('Expiry lambda test', () => {
  test.describe('Integration - Auto expiry lambda test', () => {
    initAutoExpiryLambdaTests();
  });
  test.describe('blood test expiry write back test', () => {
    bloodTestExpiryWriteBackTest();
  });
  test.describe('streaming expired heath check test', () => {
    streamingExpiredHealthCheckTest();
  });
  test.describe('fully expired heath check after blood test ordered & write back to GP record', () => {
    fullyExpiryAfterBloodTestOrderAndWriteBackTest();
  });

  test.describe('Health check expires after 90 days without ordering lab tests', () => {
    questionnaireExpiresWithoutBloodOrderTest();
  });

  test.describe('Health check expires after 90 days without ordering lab tests', () => {
    healthCheckExpiresAfterOrderingBloodTest();
  });

  test.describe('Lab results received after health check expires', () => {
    labResultsReceivedAfterHealthCheckExpires();
  });
});

test.describe('Partial writeback test', () => {
  test.describe('Partial writeback integration test', () => {
    partialWriteBackIntegrationTest();
  });

  test.describe('Partial writeback lambda test', () => {
    partialWriteBackLambdaTest();
  });
});

test.describe('E2E - Blood pressure shutter screen journey with EMIS, PDM and Email integration', () => {
  bloodPressureShutterScreenJourneyTests();
});

test.describe('PDM integration test', () => {
  pdmIntegrationTest();
});
