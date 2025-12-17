import { Commons } from '../../../src/lib/commons';
import Sinon from 'ts-sinon';
import { LambdaClientService } from '../../../src/lib/aws/lambda-client';
import { type InvokeCommandOutput, LambdaClient } from '@aws-sdk/client-lambda';

describe('LambdaClientService tests', () => {
  const encoder = new TextEncoder();
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let lambdaClientStub: Sinon.SinonStubbedInstance<LambdaClient>;
  let service: LambdaClientService;

  const lambdaToInvokeName = 'some-lambda';
  const params = { paramA: 'a', paramB: 10 };
  const payload = { test: 'response' };
  const lambdaResponse = {
    Payload: encoder.encode(JSON.stringify(payload))
  } as unknown as InvokeCommandOutput;

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    lambdaClientStub = sandbox.createStubInstance(LambdaClient);

    service = new LambdaClientService(
      commonsStub as unknown as Commons,
      lambdaClientStub as unknown as LambdaClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('invokeLambda', () => {
    test('should invoke lambda with correct params', async () => {
      lambdaClientStub.send.resolves(lambdaResponse);

      const response = await service.invokeLambda(lambdaToInvokeName, params);

      expect(lambdaClientStub.send.calledOnce).toBeTruthy();
      expect(lambdaClientStub.send.getCall(0).args[0].input).toMatchObject({
        FunctionName: lambdaToInvokeName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(params)
      });

      expect(response).toMatchObject(lambdaResponse);
    });

    test('when error is thrown should re-throw it', async () => {
      const exception = new Error('Test error');
      lambdaClientStub.send.throwsException(exception);

      await expect(
        service.invokeLambda(lambdaToInvokeName, params)
      ).rejects.toThrow(exception);
    });
  });
});
