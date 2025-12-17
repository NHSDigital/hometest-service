import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios';
import { RoutePath } from '../models/route-paths';
import { backendApiEndpoint } from '../../settings';

const axiosConfig: AxiosRequestConfig = {
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
};

const axiosInstance: AxiosInstance = axios.create(axiosConfig);

let isRefreshing = false;
let refreshTokenPromise: Promise<void> | null = null;
const pendingRequestsQueue: Array<(value?: unknown) => void> = [];

async function refreshToken(): Promise<void> {
  try {
    await axios.post(`${backendApiEndpoint}/refresh-token`, {}, axiosConfig);
    pendingRequestsQueue.forEach((callback) => callback());
    pendingRequestsQueue.length = 0;
  } catch {
    pendingRequestsQueue.length = 0;
    handleRefreshFailure();
  } finally {
    isRefreshing = false;
    refreshTokenPromise = null;
  }
}

function handleRefreshFailure(): void {
  const isUserFromNHSApp = window.nhsapp?.tools?.isOpenInNHSApp?.() ?? false;
  if (isUserFromNHSApp) {
    window.nhsapp.navigation.goToPage(
      window.nhsapp.navigation.AppPage.HOME_PAGE
    );
  } else {
    window.location.replace(RoutePath.LogoutPage);
  }
}

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (
        (error.response?.data as { reason?: string })?.reason ===
        'no-auth-cookie'
      ) {
        return Promise.reject(error);
      }

      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      if (!originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            pendingRequestsQueue.push(() => {
              axiosInstance(originalRequest).then(resolve).catch(reject);
            });
          });
        }

        isRefreshing = true;
        refreshTokenPromise = refreshToken();

        await refreshTokenPromise;
        return axiosInstance(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

const httpClient = {
  async postRequest<TBody, TResponse>(
    endpointUrl: string,
    body: TBody
  ): Promise<TResponse> {
    const response = await axiosInstance.post<TResponse>(endpointUrl, body);
    return response.data;
  },

  async getRequest<TResponse>(endpointUrl: string): Promise<TResponse> {
    const response = await axiosInstance.get<TResponse>(endpointUrl);
    return response.data;
  }
};

export { httpClient };
