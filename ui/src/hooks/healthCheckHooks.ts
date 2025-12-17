import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions
} from '@tanstack/react-query';
import { httpClient } from '../lib/http/http-client';
import { backendApiEndpoint } from '../settings';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import {
  type IHealthCheck,
  type IHealthCheckAnswers,
  type IHealthCheckBloodTestOrder
} from '@dnhc-health-checks/shared';
import { DefaultHttpClientErrorHandler } from '../lib/http/http-client-error-handler';
import { CacheKeys, CacheStaleTimes } from '../lib/models/cache-keys';
import healthCheckService, {
  HttpCallStatus
} from '../services/health-check-service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useHandleQueryError(isError: boolean, error: any, navigate: any) {
  useEffect(() => {
    if (isError) {
      void new DefaultHttpClientErrorHandler(navigate).handle(error);
    }
  }, [isError, error, navigate]);
}

// default health check query to use with useQuery() hook
function healthCheckQuery(): UseQueryOptions<IHealthCheck> {
  return {
    queryKey: [CacheKeys.HealthCheck],
    queryFn: async () => {
      const result = await healthCheckService.getHealthChecksByToken();
      if (
        result.status !== HttpCallStatus.Successful ||
        result.healthChecks.length === 0
      ) {
        throw new Error('No healthchecks found');
      }

      return result.healthChecks[0];
    },
    retry: 0,
    staleTime: CacheStaleTimes.HealthCheck
  };
}

// custom hook to get healthCheck from database
// it wraps useNavigate and useQuery to fetch data and redirect to error pages when fetching fails
export function useHealthCheck() {
  const navigate = useNavigate();
  const { isPending, isSuccess, data, isError, error } =
    useQuery(healthCheckQuery());
  useHandleQueryError(isError, error, navigate);
  return { isPending, isSuccess, isError, data };
}

// custom hook to update healthCheck entry in database
// it wraps useNavigate and useQuery to update data and redirect to error pages when fetching fails
// it automatically updates cached instance of healthCheck with the update value
export function useHealthCheckMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    isPending,
    isSuccess,
    data,
    isError,
    error,
    mutate,
    mutateAsync,
    reset
  } = useMutation(healthCheckMutation(queryClient));
  useHandleQueryError(isError, error, navigate);
  return { isPending, isSuccess, isError, data, mutate, mutateAsync, reset };
}

export function useHealthCheckBloodTestOrderMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    isPending,
    isSuccess,
    data,
    isError,
    error,
    mutate,
    mutateAsync,
    reset
  } = useMutation(healthCheckBloodTestOrderMutation(queryClient));
  useHandleQueryError(isError, error, navigate);
  return { isPending, isSuccess, isError, data, mutate, mutateAsync, reset };
}

export function useHealthCheckSubmitMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    isPending,
    isSuccess,
    data,
    isError,
    error,
    mutate,
    mutateAsync,
    reset
  } = useMutation(healthCheckSubmitMutation(queryClient));
  useHandleQueryError(isError, error, navigate);
  return { isPending, isSuccess, isError, data, mutate, mutateAsync, reset };
}

// default healthCheck mutation logic to use with useMutation() hook
function healthCheckMutation(queryClient: QueryClient) {
  return {
    mutationFn: async ({
      answers = {}
    }: {
      answers?: Partial<IHealthCheckAnswers>;
    }) => {
      const id = queryClient.getQueryData<IHealthCheck>([
        CacheKeys.HealthCheck
      ])?.id;
      return await httpClient.postRequest(
        `${backendApiEndpoint}/hometest/${id}/questionnaire`,
        answers
      );
    },
    retry: 0,
    onSuccess: (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response: any
    ) => {
      queryClient.setQueryData(
        [CacheKeys.HealthCheck],
        response.updatedHealthCheck
      );
    }
  };
}

function healthCheckBloodTestOrderMutation(queryClient: QueryClient) {
  return {
    mutationFn: async ({
      bloodTestOrder = {}
    }: {
      bloodTestOrder?: Partial<IHealthCheckBloodTestOrder>;
    }) => {
      const id = queryClient.getQueryData<IHealthCheck>([
        CacheKeys.HealthCheck
      ])?.id;
      return await httpClient.postRequest(
        `${backendApiEndpoint}/hometest/${id}/order`,
        bloodTestOrder
      );
    },
    retry: 0,
    onSuccess: (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response: any
    ) => {
      queryClient.setQueryData(
        [CacheKeys.HealthCheck],
        response.updatedHealthCheck
      );
    }
  };
}

function healthCheckSubmitMutation(queryClient: QueryClient) {
  return {
    mutationFn: async () => {
      const id = queryClient.getQueryData<IHealthCheck>([
        CacheKeys.HealthCheck
      ])?.id;
      const uri = `${backendApiEndpoint}/hometest/${id}/questionnaire/submit`;
      return await httpClient.postRequest(uri, {});
    },
    retry: 0,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [CacheKeys.HealthCheck] });
    }
  };
}
