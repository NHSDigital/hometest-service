import Sinon from 'ts-sinon';
import * as uuid from 'uuid';
import { Commons } from '../../../src/lib/commons';
import { type HealthCheckResource } from '../../../src/lib/models/pdm/resource';
import { HttpClient } from '../../../src/lib/http/http-client';
import { PdmHttpClient } from '../../../src/lib/pdm/pdm-http-client';
import { NhsApiPlatformAuthenticationService } from '../../../src/lib/nhs-api-platform/nhs-api-platform-authentication-service';

const mockToken = 'not-silly-token';
const mockUUID = 'mock-uuid-at-your-service';

// Mock uuid module
jest.mock('uuid');

describe('PdmHttpClient', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();

  let commons: Sinon.SinonStubbedInstance<Commons>;
  let httpClient: sinon.SinonStubbedInstance<HttpClient>;
  let nhsApiPlatformAuthenticationService: sinon.SinonStubbedInstance<NhsApiPlatformAuthenticationService>;

  let pdmHttpClient: PdmHttpClient;

  beforeEach(() => {
    commons = sandbox.createStubInstance(Commons);
    httpClient = sandbox.createStubInstance(HttpClient);
    nhsApiPlatformAuthenticationService = sandbox.createStubInstance(
      NhsApiPlatformAuthenticationService
    );

    nhsApiPlatformAuthenticationService.getToken.resolves(mockToken);

    // Mock uuid.v4 to return mockUUID
    jest.spyOn(uuid, 'v4').mockReturnValue(mockUUID);

    pdmHttpClient = new PdmHttpClient(
      commons as unknown as Commons,
      baseUrl,
      httpClient as unknown as HttpClient,
      nhsApiPlatformAuthenticationService as unknown as NhsApiPlatformAuthenticationService
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  const baseUrl = 'https://mock.api';
  const apiUrl = baseUrl + '/patient-data-manager/FHIR/R4';

  const resourceType = 'Observation';
  const resourceId = 'juicy-id';

  const resource = {
    id: resourceId,
    resourceType
  } as unknown as HealthCheckResource;

  const defaultHeaders = {
    'X-Request-ID': mockUUID,
    Authorization: `Bearer ${mockToken}`
  };

  it('should send GET request with correct headers and url', async () => {
    const mockResponse = {
      data: { id: resourceId, resourceType },
      headers: { 'x-some-header': 'value' }
    };

    httpClient.doGetRequestWithHeaders.resolves(mockResponse);

    const result = await pdmHttpClient.getResource(resourceType, resourceId);

    expect(result).toEqual(mockResponse);
    sandbox.assert.calledOnceWithExactly(
      httpClient.doGetRequestWithHeaders,
      `${apiUrl}/${resourceType}/${resourceId}`,
      defaultHeaders
    );
  });

  it('should send POST request with correct headers and url', async () => {
    httpClient.postRequest.resolves(resource);

    const result = await pdmHttpClient.postResource(resource);

    expect(result).toEqual(resource);
    sandbox.assert.calledOnceWithExactly(
      httpClient.postRequest,
      `${apiUrl}/${resource.resourceType}`,
      JSON.stringify(resource),
      defaultHeaders
    );
  });

  it('should send POST request with correct headers and url for a bundle resource', async () => {
    const bundleResource = {
      id: resourceId,
      resourceType: 'Bundle'
    } as unknown as HealthCheckResource;
    httpClient.postRequest.resolves(bundleResource);

    const result = await pdmHttpClient.postBundle(bundleResource);

    expect(result).toEqual(bundleResource);
    sandbox.assert.calledOnceWithExactly(
      httpClient.postRequest,
      apiUrl,
      JSON.stringify(bundleResource),
      defaultHeaders
    );
  });

  it('should send PUT request with correct headers and url', async () => {
    httpClient.putRequest.resolves(resource);

    const result = await pdmHttpClient.putResource(resource);

    expect(result).toEqual(resource);
    sandbox.assert.calledOnceWithExactly(
      httpClient.putRequest,
      `${apiUrl}/${resource.resourceType}/${resource.id}`,
      JSON.stringify(resource),
      {
        ...defaultHeaders,
        'If-None-Match': '*'
      }
    );
  });
});
