import { randomUUID } from "crypto";

import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

const LOCALSTACK_ENDPOINT = process.env.LOCALSTACK_ENDPOINT_URL ?? "http://localhost:4566";

export class LambdaInvoker {
  private readonly client: LambdaClient;

  constructor() {
    this.client = new LambdaClient({
      region: "eu-west-2",
      endpoint: LOCALSTACK_ENDPOINT,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
      },
    });
  }

  async invokeReminderDispatch(): Promise<void> {
    const payload = {
      id: randomUUID(),
      source: "aws.events",
      "detail-type": "ReminderDispatchEvent",
    };

    const command = new InvokeCommand({
      FunctionName: "hometest-service-reminder-dispatch-lambda",
      InvocationType: "RequestResponse",
      Payload: Buffer.from(JSON.stringify(payload)),
    });

    const response = await this.client.send(command);

    if (response.FunctionError) {
      throw new Error(
        `Reminder dispatch invocation failed with function error: ${response.FunctionError}`,
      );
    }
  }
}
