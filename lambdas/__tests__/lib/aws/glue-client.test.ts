import { GlueClient } from '@aws-sdk/client-glue';
import { GlueClientService } from '../../../src/lib/aws/glue-client';
import { Commons } from '../../../src/lib/commons';
import Sinon from 'ts-sinon';

describe('GlueClientService tests', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let glueClientStub: Sinon.SinonStubbedInstance<GlueClient>;
  let service: GlueClientService;

  const databaseName = 'some-database';
  const tableName = 'some-table';

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);

    glueClientStub = sandbox.createStubInstance(GlueClient);

    service = new GlueClientService(
      commonsStub as unknown as Commons,
      glueClientStub as unknown as GlueClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('getTable', () => {
    test('should get table with correct params', async () => {
      const tableResponse = {
        Table: {
          Name: tableName
        }
      };
      glueClientStub.send.resolves(tableResponse);

      const response = await service.getTable(databaseName, tableName);

      expect(glueClientStub.send.calledOnce).toBeTruthy();
      expect(glueClientStub.send.getCall(0).args[0].input).toMatchObject({
        DatabaseName: databaseName,
        Name: tableName
      });

      expect(response).toBe(tableResponse.Table);
    });

    test('when error is thrown should re-throw it', async () => {
      const exception = new Error('Test error');
      glueClientStub.send.throwsException(exception);

      await expect(
        service.getTable(databaseName, tableName)
      ).rejects.toThrowError('Test error');
    });
  });
});
