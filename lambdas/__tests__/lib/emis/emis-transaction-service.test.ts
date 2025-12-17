import Sinon from 'ts-sinon';
import {
  type CommonPayloadConfig,
  EmisTransactionService,
  type FileRecordPayloadConfig
} from '../../../src/lib/emis/emis-transaction-service';
import { DigitalSignatureGeneratorService } from '../../../src/lib/emis/digital-signature-generator-service';
import { EmisTransactionHttpClient } from '../../../src/lib/emis/emis-transaction-http-client';
import { Commons } from '../../../src/lib/commons';
import * as uuid from 'uuid';
import { type EmisConsultationElement } from '../../../src/lib/emis/request-templates/generic-template';
import { S3Client } from '../../../src/lib/aws/s3-client';

jest.mock('uuid');
const mockUUID = 'MOCKUUID';
jest.spyOn(uuid, 'v4').mockReturnValue(mockUUID);
const mockDate = new Date('2024-05-01');
jest.useFakeTimers().setSystemTime(mockDate);

describe('EmisTransactionService', () => {
  const nhsNumber = '9285931021';
  const healthCheckId = 'abcd1234';
  const payloadBucketName = 'payloadBucket';
  const odsCode = 'Q1234';
  const consultations: EmisConsultationElement[] = [
    {
      Header: {
        Value: 10,
        Scheme: { '#': 'test1' },
        Term: { '#': 'test2' }
      }
    }
  ];

  const commonConfig: CommonPayloadConfig = {
    apiUrl: 'http://3.11.93.54/ITK',
    method: 'emis:transactionim:records:req_FileRecord_V1_0',
    from: 'http://127.0.0.1:4848/syncsoap/',
    replyTo: 'http://www.w3.org/2005/08/addressing/anonymous',
    senderAddress: 'urn:nhs-uk:addressing:ods:A00002',
    auditIdentityId: 'emisweb',
    itkNs: 'urn:nhs-itk:ns:201005',
    itkGuid: 'uuid_E808A967-49B2-498B-AD75-1D7A0F1262D9',
    methodApiVersion: '1.0.0.0',
    methodApi: 'Emis.Interop.PatientAPI.FileRecord',
    odsOverride: undefined,
    emisHscnDns: ['8.8.8.8']
  };
  const fileRecordConfig: FileRecordPayloadConfig = {
    ...commonConfig,
    locationType: '1572871000006117',
    locationTypeId: '1572871000006117',
    locationTypeGuid: '0090F724-0A37-5E49-3F14-11FEE4D46F93',
    locationTypeDescription: 'Digital NHS Health Check',
    locationRefId: '4884',
    locationGuid: '37088C97-82FC-4B3E-BDBC-28F2C03B6CB8',
    locationName: 'Main Practice',
    isAbnormal: false,
    eventType: 5
  };
  const userDetails = {
    refId: '123',
    guid: '123-abcd'
  };

  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();

  let emisService: EmisTransactionService;
  let commons: Sinon.SinonStubbedInstance<Commons>;
  let emisClient: Sinon.SinonStubbedInstance<EmisTransactionHttpClient>;
  let signatureGeneratorService: Sinon.SinonStubbedInstance<DigitalSignatureGeneratorService>;
  let s3Client: Sinon.SinonStubbedInstance<S3Client>;

  beforeEach(() => {
    commons = sandbox.createStubInstance(Commons);
    emisClient = sandbox.createStubInstance(EmisTransactionHttpClient);
    signatureGeneratorService = sandbox.createStubInstance(
      DigitalSignatureGeneratorService
    );
    s3Client = sandbox.createStubInstance(S3Client);

    signatureGeneratorService.generateEmisItkHeaderDetails.returns({
      binarySecurityToken: 'mockBinarySecurityToken',
      messageDigest: 'mockMessageDigest',
      signature: 'mockSignature'
    });

    emisService = new EmisTransactionService(
      commons as unknown as Commons,
      emisClient as unknown as EmisTransactionHttpClient,
      signatureGeneratorService as unknown as DigitalSignatureGeneratorService,
      'machineName',
      fileRecordConfig,
      s3Client,
      payloadBucketName
    );

    emisClient.sendRequest.resolves('<EmisResponseXML/>');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('fileConsultationRecord method', () => {
    it.each([true, false])(
      'Signs and sends XML, isPartial = %s',
      async (isPartial) => {
        const result = await emisService.fileConsultationRecord(
          nhsNumber,
          odsCode,
          consultations,
          userDetails,
          healthCheckId,
          isPartial
        );

        validateIfEmisResponseIsReturnedToTheConsumer(result);
        Sinon.assert.calledOnce(emisClient.sendRequest);
        const emisRequestXml = emisClient.sendRequest.getCall(0).args[0];
        validateIfExternalUserNameIsSet(emisRequestXml, odsCode);
        validateIfMachineNameIsSet(emisRequestXml);
        validateIfSpecsAreSet(emisRequestXml);
        validateIfConsultationIsSet(emisRequestXml);
        validateFileRecordXmlWasStored(
          healthCheckId,
          payloadBucketName,
          nhsNumber,
          emisRequestXml,
          s3Client.putObject,
          isPartial
        );
        validateIfGpOdsCodeSet(emisRequestXml, odsCode);
      }
    );
  });

  describe('getActiveUsers method', () => {
    it('Signs and sends XML', async () => {
      const result = await emisService.getActiveUsers(odsCode);

      validateIfEmisResponseIsReturnedToTheConsumer(result);
      Sinon.assert.calledOnce(emisClient.sendRequest);
      const emisRequestXml = emisClient.sendRequest.getCall(0).args[0];
      validateIfExternalUserNameIsSet(emisRequestXml, odsCode);
      validateIfMachineNameIsSet(emisRequestXml);
      validateIfSpecsAreSet(emisRequestXml);
      validateGetActiveUserXmlWasStored(
        odsCode,
        payloadBucketName,
        emisRequestXml,
        s3Client.putObject
      );
      validateIfGpOdsCodeSet(emisRequestXml, odsCode);
    });
  });
});

function validateIfEmisResponseIsReturnedToTheConsumer(result: string): void {
  expect(result).toEqual('<EmisResponseXML/>');
}

function validateIfExternalUserNameIsSet(
  emisRequestXml: string,
  odsCode: string
): void {
  expect(emisRequestXml).toContain(
    `<ExternalUserName>DNHSHC_${odsCode}</ExternalUserName>`
  );
}

function validateIfGpOdsCodeSet(
  emisRequestXml: string,
  expectedOdsCode: string
): void {
  expect(emisRequestXml).toContain(
    `<itk:address uri="urn:nhs-uk:addressing:ods:${expectedOdsCode}"/>`
  );
}

function validateIfMachineNameIsSet(emisRequestXml: string): void {
  expect(emisRequestXml).toContain(`<MachineName>machineName</MachineName>`);
}

function validateIfSpecsAreSet(emisRequestXml: string): void {
  expect(emisRequestXml).toContain(
    `<itk:spec key="emis:BinarySecurityToken" value="mockBinarySecurityToken"/>`
  );
  expect(emisRequestXml).toContain(
    `<itk:spec key="emis:MessageDigest" value="mockMessageDigest"/>`
  );
  expect(emisRequestXml).toContain(
    `<itk:spec key="emis:Signature" value="mockSignature"/>`
  );
}

function validateIfConsultationIsSet(emisRequestXml: string): void {
  expect(emisRequestXml).toContain(
    `<ConsultationElement><Header><Value>10</Value><Scheme>test1</Scheme><Term>test2</Term></Header></ConsultationElement>`
  );
}

function validateFileRecordXmlWasStored(
  healthCheckId: string,
  payloadBucketName: string,
  nhsNumber: string,
  xml: string,
  putObjectSpy: Sinon.SinonSpy,
  isPartial: boolean
): void {
  const expectedFileName = `${isPartial ? 'Incomplete' : ''}FileRecord/${healthCheckId}_${mockDate.toISOString()}`;
  const expectedXml = xml.replaceAll(nhsNumber, '**********');
  Sinon.assert.calledOnceWithExactly(
    putObjectSpy,
    payloadBucketName,
    expectedFileName,
    expectedXml
  );
}

function validateGetActiveUserXmlWasStored(
  odsCode: string,
  payloadBucketName: string,
  expectedXml: string,
  putObjectSpy: Sinon.SinonSpy
): void {
  const expectedFileName = `GetActiveUsers/${odsCode}_${mockDate.toISOString()}`;
  Sinon.assert.calledOnceWithExactly(
    putObjectSpy,
    payloadBucketName,
    expectedFileName,
    expectedXml
  );
}
