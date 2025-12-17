import {
  AthenaClient,
  type NamedQuery,
  type QueryExecution
} from '@aws-sdk/client-athena';
import { AthenaClientService } from '../../../src/lib/aws/athena-client';
import { Commons } from '../../../src/lib/commons';
import Sinon from 'ts-sinon';

describe('AthenaClientService tests', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let athenaClientStub: Sinon.SinonStubbedInstance<AthenaClient>;
  let service: AthenaClientService;

  const namedQueryId = 'some-named-query-id';
  const queryString = 'SELECT * FROM some_table;';
  const databaseName = 'some-database';
  const outputLocation = 's3://some-output-location/';
  const queryExecutionId = 'some-query-execution-id';
  const workgroup = 'some-workgroup';

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);

    athenaClientStub = sandbox.createStubInstance(AthenaClient);

    service = new AthenaClientService(
      commonsStub as unknown as Commons,
      athenaClientStub as unknown as AthenaClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('startQueryExecution', () => {
    test('should start query execution with correct params', async () => {
      const startResponse = {
        QueryExecutionId: queryExecutionId
      };
      athenaClientStub.send.resolves(startResponse);

      const response = await service.startQueryExecution(
        queryString,
        databaseName,
        outputLocation,
        workgroup
      );

      expect(athenaClientStub.send.calledOnce).toBeTruthy();
      expect(athenaClientStub.send.getCall(0).args[0].input).toMatchObject({
        QueryString: queryString,
        QueryExecutionContext: { Database: 'some-database' },
        ResultConfiguration: { OutputLocation: 's3://some-output-location/' }
      });

      expect(response).toBe(queryExecutionId);
    });

    test('when error is thrown should re-throw it', async () => {
      const exception = new Error('Test error');
      athenaClientStub.send.throwsException(exception);

      await expect(
        service.startQueryExecution(
          queryString,
          databaseName,
          outputLocation,
          workgroup
        )
      ).rejects.toThrow(exception);
    });
  });

  describe('getNamedQuery', () => {
    test('should get named query with correct params', async () => {
      const namedQuery: NamedQuery = {
        Name: 'Test Named Query',
        Description: 'A test named query',
        Database: 'some-database',
        QueryString: queryString,
        NamedQueryId: namedQueryId
      };
      const getResponse = {
        NamedQuery: namedQuery
      };
      athenaClientStub.send.resolves(getResponse);

      const response = await service.getNamedQuery(namedQueryId);

      expect(athenaClientStub.send.calledOnce).toBeTruthy();
      expect(athenaClientStub.send.getCall(0).args[0].input).toMatchObject({
        NamedQueryId: namedQueryId
      });

      expect(response).toBe(namedQuery);
    });

    test('when error is thrown should re-throw it', async () => {
      const exception = new Error('Test error');
      athenaClientStub.send.throwsException(exception);

      await expect(service.getNamedQuery(namedQueryId)).rejects.toThrow(
        exception
      );
    });
  });

  describe('getQueryExecution', () => {
    test('should get query execution with correct params', async () => {
      const queryExecution: QueryExecution = {
        QueryExecutionId: queryExecutionId,
        Status: {
          State: 'SUCCEEDED'
        }
      };
      const getResponse = {
        QueryExecution: queryExecution
      };
      athenaClientStub.send.resolves(getResponse);

      const response = await service.getQueryExecution(queryExecutionId);

      expect(athenaClientStub.send.calledOnce).toBeTruthy();
      expect(athenaClientStub.send.getCall(0).args[0].input).toMatchObject({
        QueryExecutionId: queryExecutionId
      });

      expect(response).toBe(queryExecution);
    });

    test('when error is thrown should re-throw it', async () => {
      const exception = new Error('Test error');
      athenaClientStub.send.throwsException(exception);

      await expect(service.getQueryExecution(queryExecutionId)).rejects.toThrow(
        exception
      );
    });
  });

  describe('listNamedQueries', () => {
    test('should list named queries with correct params', async () => {
      const listResponse = {
        NamedQueryIds: [namedQueryId],
        NextToken: 'some-next-token'
      };
      athenaClientStub.send.resolves(listResponse);

      const response = await service.listNamedQueries(
        workgroup,
        'some-next-token'
      );

      expect(athenaClientStub.send.calledOnce).toBeTruthy();
      expect(athenaClientStub.send.getCall(0).args[0].input).toMatchObject({
        WorkGroup: workgroup,
        NextToken: 'some-next-token'
      });

      expect(response).toMatchObject({
        namedQueryIds: [namedQueryId],
        nextToken: 'some-next-token'
      });
    });

    test('when error is thrown should re-throw it', async () => {
      const exception = new Error('Test error');
      athenaClientStub.send.throwsException(exception);

      await expect(
        service.listNamedQueries(workgroup, 'some-next-token')
      ).rejects.toThrow(exception);
    });
  });
});
