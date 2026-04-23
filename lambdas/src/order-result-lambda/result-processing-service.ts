import { Observation } from "fhir/r4";

import { InvokedLambdaResponse, LambdaClientInterface } from "../lib/lambda/lambda-client";
import { ResultProcessingHandoffMessage } from "./models";

export interface ProcessValidatedResultInput {
  correlationId: string;
  observation: Observation;
}

export interface ResultProcessingService {
  processValidatedResult(input: ProcessValidatedResultInput): Promise<void>;
}

export interface ResultProcessingHandoffServiceDependencies {
  lambdaClient: LambdaClientInterface;
  resultProcessingFunctionName: string;
}

export class ResultProcessingHandoffService implements ResultProcessingService {
  constructor(private readonly dependencies: ResultProcessingHandoffServiceDependencies) {}

  async processValidatedResult({
    correlationId,
    observation,
  }: ProcessValidatedResultInput): Promise<void> {
    const { lambdaClient, resultProcessingFunctionName } = this.dependencies;

    const message: ResultProcessingHandoffMessage = {
      headers: {
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify(observation),
    };

    const response: InvokedLambdaResponse = await lambdaClient.invoke(
      resultProcessingFunctionName,
      JSON.stringify(message),
    );

    if (response.statusCode !== 200) {
      throw new Error(`Result processing lambda returned status code ${response.statusCode}`);
    }
  }
}
