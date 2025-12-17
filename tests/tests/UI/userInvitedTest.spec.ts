import { AuditEventType } from '@dnhc-health-checks/shared';
import { test, expect } from '../../fixtures/commonFixture';
import {
  EligibilitySectionDataFactory,
  EligibilitySectionDataType
} from '../../lib/flows/EligibilitySection/EligibilitySectionDataFactory';
import { EligibilitySectionFlow } from '../../lib/flows/EligibilitySection/EligibilitySectionFlow';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

let healthCheckId: string;

[
  {
    user: EligibilitySectionDataType.ELIGIBLE_USER,
    expectedAuditEvent: AuditEventType.PatientNotInvited,
    description: 'user in not invited'
  },
  {
    user: EligibilitySectionDataType.ELIGIBLE_USER_WITH_INVITATION,
    expectedAuditEvent: AuditEventType.PatientInvited,
    description: 'user is invited'
  }
].forEach(({ user, expectedAuditEvent, description }) => {
  test.describe(`User Invite eligibility Test`, () => {
    test.beforeEach(
      async ({ testedUser, dynamoDBServiceUtils, dbAuditEvent }) => {
        healthCheckId =
          await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
            testedUser,
            HealthCheckFactory.createHealthCheck(
              testedUser,
              HealthCheckType.INITIAL
            )
          );
        await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
      }
    );

    test.afterEach(
      async ({ dbHealthCheckService, dbAuditEvent, testedUser }) => {
        await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
        await dbHealthCheckService.deleteItemById(healthCheckId);
      }
    );

    test(
      `When ${description} then ${expectedAuditEvent} event is created`,
      {
        tag: ['@checkEligibility', '@regression']
      },
      async ({ taskListPage, dbAuditEvent, testedUser, page }) => {
        const testStartDate = new Date().toISOString();

        await test.step(`Go to the TaskList page and complete eligibility section`, async () => {
          await taskListPage.goToTaskListPageAndWaitForLoading();

          const data = new EligibilitySectionDataFactory(user).getData();
          await new EligibilitySectionFlow(data, page, true).completeSection();
        });

        await test.step(`Check if ${expectedAuditEvent} event was created`, async () => {
          const lastMessage =
            await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
              testedUser.nhsNumber,
              expectedAuditEvent,
              testStartDate
            );
          expect(lastMessage).toBeTruthy();
        });
      }
    );
  });
});
