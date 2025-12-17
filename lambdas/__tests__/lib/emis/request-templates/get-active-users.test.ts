import { toXML } from 'to-xml';
import * as uuid from 'uuid';

import { type GetActiveUsersPayloadConfig } from '../../../../src/lib/emis/emis-transaction-service';
import {
  getSoapBody,
  getGetActiveUsersEnvelope
} from '../../../../src/lib/emis/request-templates/get-active-users';

jest.mock('uuid');
const mockUUID = 'MOCKUUID';
jest.spyOn(uuid, 'v4').mockReturnValue(mockUUID);

describe('GetActiveUsers', () => {
  const expectedXmlHeader = `<MessageID xmlns="http://www.w3.org/2005/08/addressing">${mockUUID}</MessageID>
<Action xmlns="http://www.w3.org/2005/08/addressing">emis:transactionim:records:req_GetActiveUsers_V1_0</Action>
<To xmlns="http://www.w3.org/2005/08/addressing">http://3.11.93.54/ITK</To>
<From xmlns="http://www.w3.org/2005/08/addressing">http://127.0.0.1:4848/syncsoap/</From>
<ReplyTo xmlns="http://www.w3.org/2005/08/addressing">
  <Address>http://www.w3.org/2005/08/addressing/anonymous</Address>
</ReplyTo>`;
  const expectedXmlBody = `<itk:DistributionEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:itk="urn:nhs-itk:ns:201005">
  <itk:header trackingid="${mockUUID}" service="emis:transactionim:records:req_GetActiveUsers_V1_0">
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
              <Name>Emis.Interop.PatientAPI.GetActiveUsers</Name>
              <Version>1.0.0.0</Version>
            </MethodDefinition>
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

  const getActiveUsersConfig: GetActiveUsersPayloadConfig = {
    apiUrl: 'http://3.11.93.54/ITK',
    method: 'emis:transactionim:records:req_GetActiveUsers_V1_0',
    from: 'http://127.0.0.1:4848/syncsoap/',
    replyTo: 'http://www.w3.org/2005/08/addressing/anonymous',
    senderAddress: 'urn:nhs-uk:addressing:ods:A00002',
    auditIdentityId: 'emisweb',
    itkNs: 'urn:nhs-itk:ns:201005',
    itkGuid: 'uuid_E808A967-49B2-498B-AD75-1D7A0F1262D9',
    methodApiVersion: '1.0.0.0',
    methodApi: 'Emis.Interop.PatientAPI.GetActiveUsers',
    odsOverride: undefined,
    emisHscnDns: ['8.8.8.8']
  };

  it('Generates expected XML body', async () => {
    const soapBody = toXML(
      getSoapBody(getActiveUsersConfig, 'A28579'),
      undefined,
      2
    );
    expect(soapBody).toEqual(expectedXmlBody);
  });

  it('Generates expected XML envelope', async () => {
    const soapReq = toXML(
      getGetActiveUsersEnvelope(getActiveUsersConfig, 'A28579'),
      undefined,
      2
    );
    expect(soapReq.replaceAll(/\s*</g, '\n  <')).toEqual(
      expectedXml.replaceAll(/\s*</g, '\n  <')
    );
  });
});
