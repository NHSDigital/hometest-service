import { OperationOutcome } from "fhir/r4";
import { HttpClient } from "src/lib/http/http-client";

export class ResultStatusLambdaService {
  constructor(private readonly client: HttpClient) {}

  // TODO: what is the result? the type should be known
  async sendResult(result: unknown, correlationId?: string): Promise<OperationOutcome> {
    // check what the return type is, and convert to OperationOutcome if needed,
    // this will be the type returned in HOTE-1100
    try {
      await this.client.post<unknown>(
        "result/status",
        result,
        { "X-Correlation-Id": correlationId ?? "null" },
        "application/fhir+json",
      );
      // TODO: Do we need to return anything here? Is it the responsibility of this code to generate
      //  the operation outcome or should that be higher up.
      //  Or maybe we don't catch the error here and let that propagate up?
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
    } catch (error: unknown) {
      return {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "fatal",
            code: "exception",
            diagnostics: `Failed to invoke status lambda: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
}
