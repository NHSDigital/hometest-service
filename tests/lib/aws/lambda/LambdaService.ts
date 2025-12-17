import {
  LambdaClient,
  InvokeCommand,
  type InvokeCommandOutput,
  GetFunctionConfigurationCommand,
  UpdateFunctionConfigurationCommand,
  GetFunctionCommand,
  type GetFunctionCommandOutput
} from '@aws-sdk/client-lambda';

export class LambdaService {
  lambdaClient: LambdaClient;
  envName: string;

  constructor(evnName: string) {
    this.lambdaClient = new LambdaClient({ region: 'eu-west-2' });
    this.envName = evnName;
  }

  public async pause(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async runLambdaWithParameters(
    lambdaName: string,
    payload: unknown,
    maxAttempts: number = 10,
    delayMs: number = 3000
  ): Promise<InvokeCommandOutput> {
    const params = {
      FunctionName: lambdaName,
      Payload: JSON.stringify(payload)
    };
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const data = await this.lambdaClient.send(new InvokeCommand(params));
        console.log(
          `Successful lambda invocation - response code: ${JSON.stringify(data.$metadata.httpStatusCode, null, 2)}`
        );
        return data;
      } catch (error: any) {
        if (error?.name === 'TooManyRequestsException') {
          attempts++;
          const delay = delayMs * 2 ** attempts;
          console.warn(
            `Attempt ${attempts + 1} failed due to rate limiting. Retrying in ${delay} ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }

    throw new Error(
      `Failed to invoke lambda after ${maxAttempts + 1} attempts due to rate limiting.`
    );
  }

  public async updateLambdaVariable(
    lambdaName: string,
    varToUpdate: string,
    varValue: string
  ): Promise<void> {
    const response = await this.lambdaClient.send(
      new GetFunctionConfigurationCommand({ FunctionName: lambdaName })
    );

    const lambdaVariables = response.Environment?.Variables;
    if (lambdaVariables !== undefined) {
      if (varToUpdate in lambdaVariables) {
        lambdaVariables[varToUpdate] = varValue;
      }
    }
    const input = {
      FunctionName: lambdaName,
      Environment: { Variables: lambdaVariables }
    };

    const updateVariableResponse = await this.lambdaClient.send(
      new UpdateFunctionConfigurationCommand(input)
    );
    console.log(JSON.stringify(updateVariableResponse, null, 2));

    let responseAfterUpdate;
    do {
      await this.pause(2000);
      responseAfterUpdate = await this.lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: lambdaName })
      );
    } while (responseAfterUpdate.LastUpdateStatus === 'InProgress');
  }

  public async getLambdaConfiguration(
    lambdaName: string
  ): Promise<GetFunctionCommandOutput> {
    return await this.lambdaClient.send(
      new GetFunctionCommand({ FunctionName: lambdaName })
    );
  }
}
