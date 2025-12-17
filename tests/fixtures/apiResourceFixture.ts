import { test as base } from '@playwright/test';
import { BackendApiResource } from '../lib/apiClients/backendApiResources/BackendApiResource';
import { LabResultsApiResource } from '../lib/apiClients/labResultsApiResources/LabResultsApiResource';
import { NotifyCallbackApiResource } from '../lib/apiClients/notifyCallbackResources/NotifyCallbackApiResources';
import { MtlsResultsApiResource } from '../lib/apiClients/mtlsResultsApiResources/MtlsResultsApiResource';
import { ApimProxyApiResource } from '../lib/apiClients/apimProxyApiResources/LabResultsApimProxyApiResource';

export interface ApiResourceFixture {
  backendApiResource: BackendApiResource;
  labResultsApiResource: LabResultsApiResource;
  notifyCallbackApiResource: NotifyCallbackApiResource;
  mtlsResultsApiResource: MtlsResultsApiResource;
  apimProxyApiResource: ApimProxyApiResource;
}

export const apiResourceFixture = base.extend<ApiResourceFixture>({
  backendApiResource: async ({}, use) => {
    await use(new BackendApiResource());
  },
  labResultsApiResource: async ({}, use) => {
    await use(new LabResultsApiResource());
  },
  notifyCallbackApiResource: async ({}, use) => {
    await use(new NotifyCallbackApiResource());
  },
  mtlsResultsApiResource: async ({}, use) => {
    await use(new MtlsResultsApiResource());
  },
  apimProxyApiResource: async ({}, use) => {
    await use(new ApimProxyApiResource());
  }
});
