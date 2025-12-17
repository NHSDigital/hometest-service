import { type ErrorObject } from 'ajv';
import { test, expect } from '../../../fixtures/commonFixture';
import { AuditEventType } from '@dnhc-health-checks/shared';
import { type AuditEventBody } from '../../../lib/apiClients/HealthCheckModel';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../../testData/healthCheck/healthCheckFactory';

let healthCheckIdForEvent: string;
let eventId: string;

test.describe('Backend API, events endpoint', () => {
  test.beforeAll(
    'Fetching data from the token for the test',
    async ({ testedUser, dynamoDBServiceUtils }) => {
      healthCheckIdForEvent =
        await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
          testedUser,
          HealthCheckFactory.createHealthCheck(
            testedUser,
            HealthCheckType.QUESTIONNAIRE_COMPLETED
          )
        );
    }
  );

  test.describe('Events endpoint positive scenarios', () => {
    test.afterEach(
      'Deleting an audit event item from Db after tests',
      async ({ dbAuditEvent }) => {
        await dbAuditEvent.deleteItemById(eventId);
      }
    );

    test(
      'POST request, create an audit event with a minimal body',
      {
        tag: ['@api', '@post', '@events']
      },
      async ({ dbAuditEvent, testedUser, backendApiResource }) => {
        const testStartDate = new Date().toISOString();
        const eventsRequestBodyMinimal: AuditEventBody = {
          healthCheckId: healthCheckIdForEvent,
          eventType: AuditEventType.PatientIneligibleAboveAgeThreshold
        };
        console.log(
          `POST response status code: ${JSON.stringify(eventsRequestBodyMinimal)}`
        );
        const response = await backendApiResource.events.createAuditEvent(
          eventsRequestBodyMinimal
        );
        console.log(`POST response status code: ${response.status()}`);
        expect(response.status()).toEqual(200);

        const dbAuditEventItem =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            testedUser.nhsNumber,
            AuditEventType.PatientIneligibleAboveAgeThreshold,
            testStartDate
          );
        expect(dbAuditEventItem?.healthCheckId).toEqual(healthCheckIdForEvent);
        expect(dbAuditEventItem?.nhsNumber).toEqual(testedUser.nhsNumber);
        expect(dbAuditEventItem?.odsCode).toEqual(testedUser.odsCode);
        expect(dbAuditEventItem?.eventType).toEqual(
          eventsRequestBodyMinimal.eventType
        );
        expect(dbAuditEventItem?.source).toEqual('browser');
        eventId = dbAuditEventItem?.id as unknown as string;
      }
    );

    test(
      'POST request, create an audit event with a details in the request body',
      {
        tag: ['@api', '@post', '@events']
      },
      async ({ testedUser, dbAuditEvent, backendApiResource }) => {
        const testStartDate = new Date().toISOString();
        const eventsRequestBodyWithDetails: AuditEventBody = {
          healthCheckId: healthCheckIdForEvent,
          eventType: AuditEventType.PatientIneligibleAboveAgeThreshold,
          details: { location: 'home' }
        };
        console.log(
          `POST response status code: ${JSON.stringify(eventsRequestBodyWithDetails)}`
        );
        const response = await backendApiResource.events.createAuditEvent(
          eventsRequestBodyWithDetails
        );
        console.log(`POST response status code: ${response.status()}`);
        expect(response.status()).toEqual(200);

        const dbAuditEventItem =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            testedUser.nhsNumber,
            AuditEventType.PatientIneligibleAboveAgeThreshold,
            testStartDate
          );
        expect(dbAuditEventItem?.healthCheckId).toEqual(healthCheckIdForEvent);
        expect(dbAuditEventItem?.nhsNumber).toEqual(testedUser.nhsNumber);
        expect(dbAuditEventItem?.odsCode).toEqual(testedUser.odsCode);
        expect(dbAuditEventItem?.eventType).toEqual(
          eventsRequestBodyWithDetails.eventType
        );
        expect(dbAuditEventItem?.source).toEqual('browser');
        expect(dbAuditEventItem?.details).toEqual(
          eventsRequestBodyWithDetails.details
        );

        eventId = dbAuditEventItem?.id as unknown as string;
      }
    );
  });

  test.describe('Events endpoint negative scenarios', () => {
    test(
      'POST request, run a request without eventType',
      {
        tag: ['@api', '@post', '@events', '@negative']
      },
      async ({ backendApiResource }) => {
        const eventsRequestBodyMinimal: AuditEventBody = {
          healthCheckId: healthCheckIdForEvent
        };
        console.log(
          `POST response status code: ${JSON.stringify(eventsRequestBodyMinimal)}`
        );
        const response = await backendApiResource.events.createAuditEvent(
          eventsRequestBodyMinimal
        );
        console.log(`POST response status code: ${response.status()}`);
        const body = (await response.json()) as ErrorObject[];
        console.log(`POST response body: ${JSON.stringify(body, null, 2)}`);
        expect(response.status()).toEqual(400);
        expect(body[0].message).toEqual(
          "must have required property 'eventType'"
        );
      }
    );

    test(
      'POST request, run a request with incorrect eventType',
      {
        tag: ['@api', '@post', '@events', '@negative']
      },
      async ({ backendApiResource }) => {
        const eventsRequestBodyMinimal: AuditEventBody = {
          healthCheckId: healthCheckIdForEvent,
          eventType: 'WrongOne'
        };
        console.log(
          `POST response status code: ${JSON.stringify(eventsRequestBodyMinimal)}`
        );
        const response = await backendApiResource.events.createAuditEvent(
          eventsRequestBodyMinimal
        );
        console.log(`POST response status code: ${response.status()}`);
        const body = (await response.json()) as ErrorObject[];
        console.log(`POST response body: ${JSON.stringify(body, null, 2)}`);
        expect(response.status()).toEqual(400);
        expect(body[0].message).toEqual(
          'must be equal to one of the allowed values'
        );
      }
    );
  });
});
