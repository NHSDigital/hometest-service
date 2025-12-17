import { RoutePath } from '../lib/models/route-paths';
import { NhsLoginService } from '../lib/nhs-login/NhsLoginService';
import { NhcQueryParams } from '../lib/routes/nhc-query-params';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Spinner } from '../lib/pages/spinner';

export default function SingleSignOnPage() {
  const navigate = useNavigate();
  const nhsLoginService = new NhsLoginService();
  const { urlSource, assertedLoginIdentity } = new NhcQueryParams(
    window.location.search
  );

  const stateParams = {
    ...(urlSource && { urlSource })
  };

  useEffect(() => {
    if (assertedLoginIdentity) {
      // prevents browsers back button from going back to this sso page
      window.location.replace(
        nhsLoginService.createAuthorizeUri({
          assertedLoginIdentity: assertedLoginIdentity,
          stateParams
        })
      );
    } else {
      navigate(RoutePath.HomePage + window.location.search, { replace: true });
    }
  }, []);

  return <Spinner />;
}
