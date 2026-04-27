import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { OrderService } from "../lib/db/order-db";
import { AWSLambdaClient } from "../lib/lambda/lambda-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { retrieveMandatoryEnvVariable } from "../lib/utils/utils";
import {
  ResultProcessingHandoffService,
  ResultProcessingService,
} from "./result-processing-service";

export interface Environment {
  orderService: OrderService;
  resultProcessingService: ResultProcessingService;
}

export function buildEnvironment(): Environment {
  const awsRegion = retrieveMandatoryEnvVariable("AWS_REGION");
  const resultProcessingFunctionName = retrieveMandatoryEnvVariable(
    "RESULT_PROCESSING_FUNCTION_NAME",
  );

  const secretsClient = new AwsSecretsClient(awsRegion);
  const dbClient = new PostgresDbClient(postgresConfigFromEnv(secretsClient));
  const orderService = new OrderService(dbClient);
  const lambdaClient = new AWSLambdaClient(awsRegion);
  const resultProcessingService = new ResultProcessingHandoffService({
    lambdaClient,
    resultProcessingFunctionName,
  });

  return {
    orderService,
    resultProcessingService,
  };
}

let _env: Environment | undefined;

export function init(): Environment {
  _env ??= buildEnvironment();
  return _env;
}
