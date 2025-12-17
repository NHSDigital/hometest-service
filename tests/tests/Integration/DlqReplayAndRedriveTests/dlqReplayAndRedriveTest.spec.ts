import { test } from '../../../fixtures/commonFixture';
import dlqReplayAndRedriveTest from './dlqReplayAndRedrive';
import dlqReplayAndRedriveMultipleMessagesTest from './dlqReplayAndRedriveMultipleMessages';
import dlqReplayAndRedriveRetryLimitTest from './dlqReplayAndRedriveRetryLimit';

test.describe('Integration - DLQ replay and redrive test', () => {
  dlqReplayAndRedriveTest();
});

test.describe('Integration - DLQ replay and redrive multiple messages test', () => {
  dlqReplayAndRedriveMultipleMessagesTest();
});

test.describe('Integration - DLQ replay and redrive retry limit test', () => {
  dlqReplayAndRedriveRetryLimitTest();
});
