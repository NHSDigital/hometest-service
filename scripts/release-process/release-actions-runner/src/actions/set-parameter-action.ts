import logger from '../logger';
import { PutParameterCommand, type SSMClient } from '@aws-sdk/client-ssm';
import { type IAction } from '../types';

export class SetParameterAction implements IAction {
  protected client: SSMClient;
  protected readonly actionName: string;
  protected readonly keyName: string;
  protected readonly value: string;

  constructor(client: SSMClient, keyName: string, value: string) {
    this.client = client;
    this.keyName = keyName;
    this.value = value;
    this.actionName = 'SetSSMParameterValue';
  }

  getActionName(): string {
    return this.actionName;
  }

  public async run(envName: string, dryRun: boolean): Promise<void> {
    const parameterName = `/${envName}/dhc/${this.keyName}`;

    if (dryRun) {
      logger.info('DRY RUN: Adding a new parameter key', {
        envName,
        name: parameterName,
        value: this.value
      });
      return;
    }

    await this.putParameter(parameterName, this.value);
  }

  public async cleanUp(): Promise<void> {}

  private async putParameter(
    parameterName: string,
    parameterValue: string
  ): Promise<void> {
    const command = new PutParameterCommand({
      Name: parameterName,
      Value: parameterValue,
      Type: 'String',
      Overwrite: true
    });
    try {
      await this.client.send(command);
      logger.info('Parameter created successfully', {
        parameterName,
        parameterValue
      });
    } catch (error) {
      logger.error('Failed to created parameter', {
        error,
        parameterName,
        parameterValue
      });
    }
  }
}
