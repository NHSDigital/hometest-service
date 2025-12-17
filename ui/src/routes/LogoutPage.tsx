import { useEffect, useState } from 'react';
import { httpClient } from '../lib/http/http-client';
import { backendApiEndpoint } from '../settings';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../layouts/PageLayout';
import { Button } from 'nhsuk-react-components';
import { DefaultHttpClientErrorHandler } from '../lib/http/http-client-error-handler';
import { NhsLoginService } from '../lib/nhs-login/NhsLoginService';
import { useQueryClient } from '@tanstack/react-query';
import { CacheKeys } from '../lib/models/cache-keys';
import { AxiosError } from 'axios';

export default function LogoutPage() {
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const nhsLoginService = new NhsLoginService();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function loginViaNhsLogin() {
    window.location.href = nhsLoginService.createAuthorizeUri();
  }

  useEffect(() => {
    const doLogout = async () => {
      try {
        await httpClient
          .postRequest(`${backendApiEndpoint}/logout`, {})
          .catch((error) => {
            if (
              error instanceof AxiosError &&
              error.response?.status === 401 &&
              error.response?.data?.reason === 'no-auth-cookie'
            ) {
              return;
            }
            throw error;
          });

        await queryClient.invalidateQueries({
          queryKey: [CacheKeys.PatientInfo]
        });
        await queryClient.invalidateQueries({
          queryKey: [CacheKeys.HealthCheck]
        });

        setIsLoggedOut(true);
      } catch (error) {
        void new DefaultHttpClientErrorHandler(navigate).handle(error);
      }
    };

    void doLogout();
  }, [navigate, queryClient]);

  return (
    <PageLayout>
      {!isLoggedOut ? (
        <div>Logging out...</div>
      ) : (
        <>
          <h1>You have logged out</h1>
          <p>Log in to continue your NHS Health Check online.</p>
          <Button
            className="app-button--login"
            onClick={() => loginViaNhsLogin()}
          >
            Continue
          </Button>
        </>
      )}
    </PageLayout>
  );
}
