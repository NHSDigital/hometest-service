import {
  type AthenaClient,
  type NamedQuery,
  type StartQueryExecutionCommandInput,
  StartQueryExecutionCommand,
  GetNamedQueryCommand,
  GetQueryExecutionCommand,
  ListNamedQueriesCommand
} from '@aws-sdk/client-athena';
import { AWSService } from '../aws-service';
import type { Commons } from '../commons';

export class AthenaClientService extends AWSService<AthenaClient> {
  constructor(commons: Commons, athenaClient: AthenaClient) {
    super(commons, 'AthenaClientService', athenaClient);
  }

  async startQueryExecution(
    queryString: string,
    databaseName: string,
    outputLocation: string,
    workgroup: string
  ): Promise<string> {
    try {
      this.logger.info('about to start query execution', {
        databaseName,
        outputLocation,
        workgroup
      });
      const input: StartQueryExecutionCommandInput = {
        QueryString: queryString,
        QueryExecutionContext: { Database: databaseName },
        ResultConfiguration: { OutputLocation: outputLocation },
        WorkGroup: workgroup
      };
      const command = new StartQueryExecutionCommand(input);
      const response = await this.client.send(command);
      if (response.QueryExecutionId === undefined) {
        throw new Error(
          'QueryExecutionId is missing from the StartQueryExecutionCommand response'
        );
      }
      return response.QueryExecutionId;
    } catch (error) {
      this.logger.error('error occurred while starting query execution', {
        error
      });
      throw error;
    }
  }

  async getNamedQuery(namedQueryId: string): Promise<NamedQuery | null> {
    try {
      this.logger.info('about to get named query', { namedQueryId });
      const command = new GetNamedQueryCommand({
        NamedQueryId: namedQueryId
      });
      const response = await this.client.send(command);
      return response.NamedQuery ?? null;
    } catch (error) {
      this.logger.error('error occurred while getting named query', {
        error
      });
      throw error;
    }
  }

  async getQueryExecution(queryExecutionId: string) {
    try {
      this.logger.info('about to get query execution', {
        queryExecutionId
      });

      const command = new GetQueryExecutionCommand({
        QueryExecutionId: queryExecutionId
      });
      const response = await this.client.send(command);
      return response.QueryExecution;
    } catch (error) {
      this.logger.error('error occurred while getting query execution', {
        error
      });
      throw error;
    }
  }

  async listNamedQueries(
    workgroup: string,
    nextToken?: string
  ): Promise<{
    namedQueryIds?: string[];
    nextToken?: string;
  }> {
    try {
      this.logger.info('about to list named queries', { nextToken, workgroup });

      const command = new ListNamedQueriesCommand({
        WorkGroup: workgroup,
        NextToken: nextToken
      });
      const response = await this.client.send(command);
      return {
        namedQueryIds: response.NamedQueryIds,
        nextToken: response.NextToken
      };
    } catch (error) {
      this.logger.error('error occurred while listing named queries', {
        error
      });
      throw error;
    }
  }
}
