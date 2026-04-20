// Wraps AWS Lambda invocation in a service class
// Takes the lambda name + region in the constructor
// Has a sendTask() method that:
// JSON‑stringifies the Task
// Invokes the status lambda
// Returns a Promise
// Returns an OperationOutcome (FHIR standard) on success/failure
// Keeps your index.ts clean and simple
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { OperationOutcome } from "fhir/r4";

export class ResultStatusLambdaService {
  private lambdaClient: LambdaClient;

  constructor(
    private lambdaName: string,
    private region: string,
  ) {
    this.lambdaClient = new LambdaClient({ region });
  }

  async sendTask(taskPayload: any): Promise<OperationOutcome> {
    const payloadString = JSON.stringify(taskPayload);

    const command = new InvokeCommand({
      FunctionName: this.lambdaName,
      Payload: Buffer.from(payloadString),
    });

    try {
      const response = await this.lambdaClient.send(command);

      if (response.FunctionError) {
        return {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "exception",
              diagnostics: `Status lambda returned an error: ${response.FunctionError}`,
            },
          ],
        };
      }

      return {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "information",
            code: "informational",
            diagnostics: "Status update lambda invoked successfully",
          },
        ],
      };
    } catch (error: any) {
      return {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "fatal",
            code: "exception",
            diagnostics: `Failed to invoke status lambda: ${error.message}`,
          },
        ],
      };
    }
  }
}
