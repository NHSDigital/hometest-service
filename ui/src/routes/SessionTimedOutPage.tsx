import { Button, Card } from 'nhsuk-react-components';
import { NhsLoginService } from '../lib/nhs-login/NhsLoginService';
import { authSessionExpiryDurationMinutes } from '../settings';
import PageLayout from '../layouts/PageLayout';
import { useQueryClient } from '@tanstack/react-query';
import { CacheKeys } from '../lib/models/cache-keys';
import { useEffect } from 'react';

export default function SessionTimedOutPage() {
  const nhsLoginService = new NhsLoginService();
  const queryClient = useQueryClient();

  useEffect(() => {
    const doLogout = async () => {
      await queryClient.invalidateQueries({
        queryKey: [CacheKeys.PatientInfo]
      });
      await queryClient.invalidateQueries({
        queryKey: [CacheKeys.HealthCheck]
      });
    };

    void doLogout();
  }, [queryClient]);

  function loginViaNhsLogin() {
    window.location.href = nhsLoginService.createAuthorizeUri();
  }

  return (
    <PageLayout>
      <Card>
        <Card.Content>
          <Card.Heading headingLevel="H1">
            For security, we’ve logged you out
          </Card.Heading>
        </Card.Content>
      </Card>
      <p>
        As you’ve not used the service for {authSessionExpiryDurationMinutes}{' '}
        minutes, we’ve logged you out.
      </p>
      <p>We saved your answers.</p>
      <p>Select &quot;Continue&quot; to log in again.</p>
      <Button className="app-button--login" onClick={() => loginViaNhsLogin()}>
        Continue
      </Button>
    </PageLayout>
  );
}
