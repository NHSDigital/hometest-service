import { useEffect } from 'react';
import { httpClient } from '../lib/http/http-client';
import { backendApiEndpoint } from '../settings';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../layouts/PageLayout';
import { RoutePath } from '../lib/models/route-paths';
import { Spinner } from '../lib/pages/spinner';
import { type CognitoIdentityResponse, rum } from '../lib/rum/rum-client';

enum UserSource {
  NHSApp = 'nhs-app',
  Browser = 'browser'
}

enum HealthCheckEligibilityStatus {
  FAIL_ODS_CODE_DISABLED = 'ods-code-disabled',
  INELIGIBLE_IDENTITY_PROOFING_LEVEL = 'patient-ineligible-identity-proofing-level',
  FAIL_NHS_NUMBER_NOT_ALLOWED = 'nhs-number-not-allowed'
}

export default function LoginCallbackPage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const noConsentErrorDescription = 'ConsentNotGiven';

  const source = window.nhsapp.tools.isOpenInNHSApp()
    ? UserSource.NHSApp
    : UserSource.Browser;

  const nhsLoginResponse = {
    code: urlParams.get('code'),
    error: urlParams.get('error'),
    errorDescription: urlParams.get('error_description'),
    state: urlParams.get('state')
  };

  let stateData: Record<string, string> = {};
  if (nhsLoginResponse.state) {
    stateData = Object.fromEntries(new URLSearchParams(nhsLoginResponse.state));
  }

  useEffect(() => {
    const doLogin = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await httpClient.postRequest<any, any>(
        `${backendApiEndpoint}/login`,
        {
          code: nhsLoginResponse.code,
          source,
          urlSource: stateData.urlSource
        }
      );
    };

    if (!nhsLoginResponse.error) {
      doLogin()
        .then((responseData: CognitoIdentityResponse) => {
          rum.enable(responseData.token, responseData.identityId);
          navigate(RoutePath.HomePage, { replace: true });
        })
        .catch((error) => {
          if (error.response && error.response.status === 403) {
            let path;
            switch (error.response.data.reason) {
              case HealthCheckEligibilityStatus.INELIGIBLE_IDENTITY_PROOFING_LEVEL:
                path = RoutePath.NhsLoginErrorPage;
                break;
              case HealthCheckEligibilityStatus.FAIL_ODS_CODE_DISABLED:
              case HealthCheckEligibilityStatus.FAIL_NHS_NUMBER_NOT_ALLOWED:
                path = RoutePath.OdsNhsNumberNotEligiblePage;
                break;
              default:
                path = RoutePath.NotEligiblePage;
                break;
            }
            navigate(path, { replace: true });
          } else {
            navigate(RoutePath.NhsLoginErrorPage, { replace: true });
          }
        });
    } else if (
      nhsLoginResponse.errorDescription === noConsentErrorDescription
    ) {
      navigate(RoutePath.ConsentNotGivenErrorPage, { replace: true });
    } else {
      navigate(RoutePath.NhsLoginErrorPage, { replace: true });
    }
  }, []);

  return (
    <>
      {!nhsLoginResponse.error ? (
        <Spinner />
      ) : (
        <PageLayout>
          <h1>There was a problem</h1>
          <div>{nhsLoginResponse.error}</div>
          <div>{nhsLoginResponse.errorDescription}</div>
        </PageLayout>
      )}
    </>
  );
}
