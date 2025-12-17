import { test, expect } from '../../../fixtures/commonFixture';
import {
  notifyValidPayload,
  notifyInvalidPayload,
  notifyPayload500Error,
  notifyValidPayloadWithTwoMessages
} from '../../../testData/notifyPayloadTestData';

test(
  'Receive status updates from NHS Notify about messages sent to users - happy path scenario',
  {
    tag: ['@api', '@post', '@notify']
  },
  async ({ notifyCallbackApiResource }) => {
    const response =
      await notifyCallbackApiResource.sendNotification(notifyValidPayload());
    expect(
      response.status(),
      "Post to notify endpoint should have passed, but it didn't."
    ).toEqual(202);
  }
);

test(
  'Receive status updates from NHS Notify about two messages sent to users - happy path scenario with multiple messages',
  {
    tag: ['@api', '@post', '@notify']
  },
  async ({ notifyCallbackApiResource }) => {
    const response = await notifyCallbackApiResource.sendNotification(
      notifyValidPayloadWithTwoMessages()
    );
    expect(
      response.status(),
      "Post to notify endpoint should have passed, but it didn't."
    ).toEqual(202);
  }
);

test(
  'Receive status updates from NHS Notify about messages sent to users - invalid payload scenario',
  {
    tag: ['@api', '@post', '@notify']
  },
  async ({ notifyCallbackApiResource }) => {
    const response =
      await notifyCallbackApiResource.sendNotification(notifyInvalidPayload);
    expect(
      response.status(),
      "Post to notify endpoint should have failed but it didn't."
    ).toEqual(400);
  }
);

test(
  'Receive status updates from NHS Notify about messages sent to users - invalid api key scenario',
  {
    tag: ['@api', '@post', '@notify']
  },
  async ({ notifyCallbackApiResource }) => {
    const response =
      await notifyCallbackApiResource.sendNotificationWithInvalidApiKey(
        notifyInvalidPayload
      );
    expect(
      response.status(),
      "Post to notify endpoint should have failed but it didn't."
    ).toEqual(403);
  }
);

test(
  'Receive status updates from NHS Notify about messages sent to users - invalid header scenario',
  {
    tag: ['@api', '@post', '@notify']
  },
  async ({ notifyCallbackApiResource }) => {
    const response =
      await notifyCallbackApiResource.sendNotificationWithInvalidHeader(
        notifyInvalidPayload
      );
    expect(
      response.status(),
      "Post to notify endpoint should have failed but it didn't."
    ).toEqual(401);
  }
);

test(
  'Receive status updates from NHS Notify about messages sent to users - 500 error scenario',
  {
    tag: ['@api', '@post', '@notify']
  },
  async ({ notifyCallbackApiResource }) => {
    const response = await notifyCallbackApiResource.sendNotification(
      notifyPayload500Error
    );
    expect(
      response.status(),
      "Post to notify endpoint should have returned 500 error but it didn't."
    ).toEqual(500);
  }
);
