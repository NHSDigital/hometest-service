import Sinon from 'ts-sinon';
import { Commons } from '../../../src/lib/commons';
import { EmisTransactionHttpClient } from '../../../src/lib/emis/emis-transaction-http-client';
import { HttpClient } from '../../../src/lib/http/http-client';

jest.mock('../../../src/lib/http/http-client');

describe('EmisTransactionHttpClient', () => {
  const emisApiUrl = 'mockEmisUrl';
  const mockCertCommon = 'mockCertCommon';
  const mockCorrectContent = '<xml>Mock content</xml>';
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();

  let service: EmisTransactionHttpClient;
  let commons: Sinon.SinonStubbedInstance<Commons>;
  let httpClient: Sinon.SinonStubbedInstance<HttpClient>;

  beforeEach(() => {
    commons = sandbox.createStubInstance(Commons);
    httpClient = sandbox.createStubInstance(HttpClient);
    HttpClient.isHttpError = jest.fn();
    HttpClient.getHttpErrorDetails = jest.fn();

    service = new EmisTransactionHttpClient(
      commons as unknown as Commons,
      emisApiUrl,
      mockCertCommon,
      httpClient as unknown as HttpClient
    );

    httpClient.doPostRequestWithStatus.resolves({
      data: mockCorrectContent,
      httpCode: 200
    });
  });

  afterEach(() => {
    sandbox.restore();
    (HttpClient.isHttpError as jest.Mock).mockReset();
    (HttpClient.getHttpErrorDetails as jest.Mock).mockReset();
  });

  describe('sendRequest', () => {
    const mockRequestPayload = '<xml>ooh it is an XML</xml>';
    it('Calls http client with correct params and returns the response content', async () => {
      const response = await service.sendRequest(mockRequestPayload);

      sandbox.assert.calledOnceWithExactly(
        httpClient.doPostRequestWithStatus,
        emisApiUrl,
        mockRequestPayload,
        {
          'Content-Type': 'application/xml',
          CertificateCommonName: mockCertCommon
        }
      );

      expect(response).toBe(mockCorrectContent);
    });

    it('Calls http client with correct params and returns the response content', async () => {
      const response = await service.sendRequest(mockRequestPayload);

      sandbox.assert.calledOnceWithExactly(
        httpClient.doPostRequestWithStatus,
        emisApiUrl,
        mockRequestPayload,
        {
          'Content-Type': 'application/xml',
          CertificateCommonName: mockCertCommon
        }
      );

      expect(response).toBe(mockCorrectContent);
    });

    it.each([
      [
        '<xml><itk:ErrorCode>errCode</itk:ErrorCode></xml>',
        { isError: true, errorCode: 'errCode' }
      ],
      [
        '<xml><itk:ErrorDiagnosticText>some error</itk:ErrorDiagnosticText></xml>',
        { isError: true, errorDiagnosticText: 'some error' }
      ],
      [
        '<xml><itk:ErrorID>errId</itk:ErrorID><itk:ErrorText>errTxt</itk:ErrorText><itk:ErrorDiagnosticText>some error</itk:ErrorDiagnosticText><itk:ErrorCode>errCode</itk:ErrorCode></xml>',
        {
          isError: true,
          errorDiagnosticText: 'some error',
          errorCode: 'errCode',
          errorId: 'errId',
          errorText: 'errTxt'
        }
      ]
    ])(
      'Returns an error when HTTP 200 error response is returned by EMIS',
      async (xmlResponse, expectedErrorDetails) => {
        expect.assertions(2);
        httpClient.doPostRequestWithStatus.resolves({
          data: xmlResponse,
          httpCode: 200
        });
        try {
          await service.sendRequest(mockRequestPayload);
        } catch (error) {
          expect(error).toMatchObject({
            message: 'Received error response'
          });
          expect((error as any).cause).toMatchObject({
            msg: 'EMIS returned HTTP 2xx error response',
            details: { httpCode: 200, errorInfo: expectedErrorDetails }
          });
        }
      }
    );

    it.each([
      [
        201,
        '<xml><itk:ErrorCode>errCode</itk:ErrorCode></xml>',
        { isError: true, errorCode: 'errCode' }
      ],
      [204, '<xml>ok</xml>', { isError: false }],
      [
        399,
        '<xml><itk:ErrorID>errId</itk:ErrorID><itk:ErrorText>errTxt</itk:ErrorText><itk:ErrorDiagnosticText>some error</itk:ErrorDiagnosticText><itk:ErrorCode>errCode</itk:ErrorCode></xml>',
        {
          isError: true,
          errorDiagnosticText: 'some error',
          errorCode: 'errCode',
          errorId: 'errId',
          errorText: 'errTxt'
        }
      ]
    ])(
      'Returns an error when HTTP 2xx (except 200) response is returned',
      async (httpCode, xmlResponse, expectedErrorDetails) => {
        expect.assertions(2);
        httpClient.doPostRequestWithStatus.resolves({
          data: xmlResponse,
          httpCode
        });
        try {
          await service.sendRequest(mockRequestPayload);
        } catch (error) {
          expect(error).toMatchObject({
            message: 'Received error response'
          });
          expect((error as any).cause).toMatchObject({
            msg: 'EMIS returned HTTP 2xx error response',
            details: { httpCode, errorInfo: expectedErrorDetails }
          });
        }
      }
    );

    it.each([
      [
        300,
        '<xml><itk:ErrorCode>errCode</itk:ErrorCode></xml>',
        { isError: true, errorCode: 'errCode' }
      ],
      [400, '<xml>ok</xml>', { isError: false }],
      [
        500,
        '<xml><itk:ErrorID>errId</itk:ErrorID><itk:ErrorText>errTxt</itk:ErrorText><itk:ErrorDiagnosticText>some error</itk:ErrorDiagnosticText><itk:ErrorCode>errCode</itk:ErrorCode></xml>',
        {
          isError: true,
          errorDiagnosticText: 'some error',
          errorCode: 'errCode',
          errorId: 'errId',
          errorText: 'errTxt'
        }
      ]
    ])(
      'Returns an error when non 2xx response is returned',
      async (httpCode, xmlResponse, expectedErrorDetails) => {
        expect.assertions(2);
        httpClient.doPostRequestWithStatus.throwsException(
          new Error('Http error')
        );
        (HttpClient.isHttpError as jest.Mock).mockReturnValue(true);
        (HttpClient.getHttpErrorDetails as jest.Mock).mockReturnValue({
          responseData: xmlResponse,
          httpCode,
          cause: 'mockErrorCause'
        });

        try {
          await service.sendRequest(mockRequestPayload);
        } catch (error) {
          expect(error).toMatchObject({
            message: 'EMIS returned HTTP error response'
          });
          expect((error as any).cause).toEqual({
            details: {
              httpCode,
              errorInfo: expectedErrorDetails,
              underlyingCause: 'mockErrorCause'
            }
          });
        }
      }
    );
  });
});
