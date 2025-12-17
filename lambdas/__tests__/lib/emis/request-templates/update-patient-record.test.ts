import { toXML } from 'to-xml';
import * as uuid from 'uuid';

import {
  getSoapBody,
  getUpdatePatientRecordEnvelope
} from '../../../../src/lib/emis/request-templates/update-patient-record';
import { type FileRecordPayloadConfig } from '../../../../src/lib/emis/emis-transaction-service';
import { getSoapHeader } from '../../../../src/lib/emis/request-templates/generic-template';

jest.mock('uuid');
const mockUUID = 'MOCKUUID';
jest.spyOn(uuid, 'v4').mockReturnValue(mockUUID);

describe('UpdatePatientRecord', () => {
  const refId = '5';
  const guid = '123-abcd';
  const expectedXmlHeader = `<MessageID xmlns="http://www.w3.org/2005/08/addressing">${mockUUID}</MessageID>
<Action xmlns="http://www.w3.org/2005/08/addressing">emis:transactionim:records:req_FileRecord_V1_0</Action>
<To xmlns="http://www.w3.org/2005/08/addressing">http://3.11.93.54/ITK</To>
<From xmlns="http://www.w3.org/2005/08/addressing">http://127.0.0.1:4848/syncsoap/</From>
<ReplyTo xmlns="http://www.w3.org/2005/08/addressing">
  <Address>http://www.w3.org/2005/08/addressing/anonymous</Address>
</ReplyTo>`;
  const expectedXmlBody = `<itk:DistributionEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:itk="urn:nhs-itk:ns:201005">
  <itk:header trackingid="${mockUUID}" service="emis:transactionim:records:req_FileRecord_V1_0">
    <itk:addresslist>
      <itk:address uri="urn:nhs-uk:addressing:ods:A28579"/>
    </itk:addresslist>
    <itk:auditIdentity>
      <itk:id uri="emisweb"/>
    </itk:auditIdentity>
    <itk:manifest count="1">
      <itk:manifestitem id="uuid_E808A967-49B2-498B-AD75-1D7A0F1262D9" mimetype="application/xml"/>
    </itk:manifest>
    <itk:senderAddress uri="urn:nhs-uk:addressing:ods:A00002"/>
    <itk:handlingSpecification>
      <itk:spec key="emis:BinarySecurityToken" value=""/>
      <itk:spec key="emis:MessageDigest" value=""/>
      <itk:spec key="emis:Signature" value=""/>
    </itk:handlingSpecification>
  </itk:header>
  <itk:payloads count="1">
    <itk:payload id="uuid_E808A967-49B2-498B-AD75-1D7A0F1262D9">
      <EWDS xmlns="urn:nhs-itk:ns:201005">
        <RequestHeader>
          <ExternalUserName></ExternalUserName>
          <MachineName></MachineName>
        </RequestHeader>
        <RequestBody>
          <RequestMethod>
            <MethodDefinition>
              <Name>Emis.Interop.PatientAPI.FileRecord</Name>
              <Version>1.0.0.0</Version>
            </MethodDefinition>
            <Content>
              <PatientAPI>
                <SmartCardTokenId></SmartCardTokenId>
                <NhsNumber>9993855774</NhsNumber>
                <MrXml>
                  <MedicalRecord xmlns="http://www.e-mis.com/emisopen/MedicalRecord" PatientID="9993855774">
                    <ConsultationList>
                      <Consultation>
                        <GUID>${mockUUID}</GUID>
                        <AssignedDate>${new Date().toLocaleDateString('en-GB')}</AssignedDate>
                        <OriginalAuthor>
                          <User>
                            <RefID>${refId}</RefID>
                          </User>
                        </OriginalAuthor>
                        <UserID>
                          <RefID>${refId}</RefID>
                        </UserID>
                        <LocationID>
                          <RefID>4884</RefID>
                        </LocationID>
                        <LocationTypeID>
                          <RefID>1672871000006114</RefID>
                        </LocationTypeID>
                        <ElementList>
                        </ElementList>
                      </Consultation>
                    </ConsultationList>
                    <PeopleList>
                      <Person>
                        <RefID>${refId}</RefID>
                        <GUID>${guid}</GUID>
                      </Person>
                    </PeopleList>
                    <LocationList>
                      <Location>
                        <RefID>4884</RefID>
                        <GUID>37088C97-82FC-4B3E-BDBC-28F2C03B6CB8</GUID>
                        <LocationName>Main Practice</LocationName>
                        <LocationTypeID>
                          <RefID>1572871000006117</RefID>
                        </LocationTypeID>
                      </Location>
                    </LocationList>
                    <LocationTypeList>
                      <LocationType>
                        <RefID>1672871000006114</RefID>
                        <GUID>357EFD4F-7912-DE6E-13B8-D3FACED28522</GUID>
                        <Description>NHS Health Check online</Description>
                      </LocationType>
                    </LocationTypeList>
                  </MedicalRecord>
                </MrXml>
              </PatientAPI>
            </Content>
          </RequestMethod>
        </RequestBody>
      </EWDS>
    </itk:payload>
  </itk:payloads>
</itk:DistributionEnvelope>`;

  const expectedXml = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    ${expectedXmlHeader}
  </soap:Header>
  <soap:Body>
    ${expectedXmlBody}
  </soap:Body>
</soap:Envelope>`;

  const fileRecordConfig: FileRecordPayloadConfig = {
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
    locationTypeId: '1572871000006117',
    locationType: '1672871000006114',
    locationTypeGuid: '357EFD4F-7912-DE6E-13B8-D3FACED28522',
    locationTypeDescription: 'NHS Health Check online',
    locationRefId: '4884',
    locationGuid: '37088C97-82FC-4B3E-BDBC-28F2C03B6CB8',
    locationName: 'Main Practice',
    isAbnormal: false,
    eventType: 5,
    odsOverride: undefined,
    emisHscnDns: ['8.8.8.8']
  };

  it('Generates expected XML header', async () => {
    const soapHeader = toXML(
      getSoapHeader(
        fileRecordConfig.apiUrl,
        fileRecordConfig.method,
        fileRecordConfig.from,
        fileRecordConfig.replyTo
      ),
      undefined,
      2
    );
    expect(soapHeader).toEqual(expectedXmlHeader);
  });

  it('Generates expected XML body', async () => {
    const soapBody = toXML(
      getSoapBody(fileRecordConfig, 'A28579', refId, guid, '9993855774'),
      undefined,
      2
    );
    expect(soapBody).toEqual(expectedXmlBody);
  });

  it('Generates expected XML envelope', async () => {
    const soapReq = toXML(
      getUpdatePatientRecordEnvelope(
        fileRecordConfig,
        'A28579',
        refId,
        guid,
        '9993855774'
      ),
      undefined,
      2
    );
    expect(soapReq.replaceAll(/\s*</g, '\n  <')).toEqual(
      expectedXml.replaceAll(/\s*</g, '\n  <')
    );
  });
});
