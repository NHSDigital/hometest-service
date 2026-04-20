import { Commons, ConsoleCommons } from "../lib/commons";
import { retrieveMandatoryEnvVariable } from "../lib/utils/utils";
import { ResultStatusLambdaService } from "./result-status-lambda-service";

export interface Environment {
  commons: Commons;
  resultStatusLambdaService: ResultStatusLambdaService;
}

export function buildEnvironment(): Environment {
  const commons = new ConsoleCommons();

  const awsRegion = retrieveMandatoryEnvVariable("AWS_REGION");
  const resultStatusLambdaName = retrieveMandatoryEnvVariable("RESULT_STATUS_LAMBDA_NAME");

  const resultStatusLambdaService = new ResultStatusLambdaService(
    resultStatusLambdaName,
    awsRegion,
  );

  return {
    commons,
    resultStatusLambdaService,
  };
}

let _env: Environment | undefined;

export function init(): Environment {
  _env ??= buildEnvironment();
  return _env;
}
