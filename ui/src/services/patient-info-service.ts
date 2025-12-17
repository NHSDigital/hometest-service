import { backendApiEndpoint } from '../settings';
import { httpClient } from '../lib/http/http-client';
import { type QueryClient } from '@tanstack/react-query';
import { CacheKeys, CacheStaleTimes } from '../lib/models/cache-keys';

export interface IPatientInfo {
  termsAccepted: boolean;
  firstName: string;
  lastName: string;
}

export interface IUpdatePatientInfoRequest {
  termsAccepted: boolean;
}

export interface IPatientInfoService {
  getCachedOrFetchPatientInfo: (
    queryClient: QueryClient
  ) => Promise<IPatientInfo>;
  updatePatientInfo: (patientInfo: IUpdatePatientInfoRequest) => Promise<void>;
}

const getPatientInfo = async function (): Promise<IPatientInfo> {
  return await httpClient.getRequest<IPatientInfo>(
    `${backendApiEndpoint}/patient`
  );
};

const patientInfoService: IPatientInfoService = {
  getCachedOrFetchPatientInfo: async function (
    queryClient: QueryClient
  ): Promise<IPatientInfo> {
    return queryClient.fetchQuery({
      queryKey: [CacheKeys.PatientInfo],
      queryFn: async () => getPatientInfo(),
      staleTime: CacheStaleTimes.PatientInfo
    });
  },

  updatePatientInfo: async function (
    patientInfo: IUpdatePatientInfoRequest
  ): Promise<void> {
    await httpClient.postRequest(`${backendApiEndpoint}/patient`, patientInfo);
  }
};

export default patientInfoService;
