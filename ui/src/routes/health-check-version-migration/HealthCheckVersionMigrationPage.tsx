import { Checkboxes, ErrorSummary } from 'nhsuk-react-components';
import PageLayout from '../../layouts/PageLayout';
import { useNavigate } from 'react-router-dom';
import { RoutePath } from '../../lib/models/route-paths';
import { type IHealthCheckService } from '../../services/health-check-service';
import { useHealthCheck } from '../../hooks/healthCheckHooks';
import { usePageTitleContext } from '../../lib/contexts/PageTitleContext';
import { useEffect, useState } from 'react';
import CheckboxWrapper from '../../lib/components/wrapper/check-box-wrapper';
import FormButton, {
  type SubmitValidationResult
} from '../../lib/components/FormButton';
import { ReleaseInfo } from './release-info-callout';
import { Spinner } from '../../lib/pages/spinner';
import { Redirecting } from '../../lib/pages/redirecting';
import { useQueryClient } from '@tanstack/react-query';
import { CacheKeys } from '../../lib/models/cache-keys';
import { AuditEventType } from '@dnhc-health-checks/shared';
import { useAuditEvent } from '../../hooks/eventAuditHook';

export interface HealthCheckVersionMigrationPageProps {
  healthCheckApiService: IHealthCheckService;
}

export default function HealthCheckVersionMigration({
  healthCheckApiService
}: Readonly<HealthCheckVersionMigrationPageProps>) {
  const healthCheck = useHealthCheck();
  const navigate = useNavigate();
  const { triggerAuditEvent } = useAuditEvent();

  useEffect(() => {
    void triggerAuditEvent({
      eventType: AuditEventType.HealthCheckDataModelVersionMigrationOpened,
      healthCheck: healthCheck.data
    });
  }, [healthCheck.data, triggerAuditEvent]);

  const queryClient = useQueryClient();

  const { setIsPageInError } = usePageTitleContext();
  const [hasAcceptedUpdate, setHasAcceptedUpdate] = useState(false);
  const [error, setError] = useState<string>('');
  const errorMessage =
    'Confirm that you understand that you need to review the updates and submit your answers to complete the NHS Health Check online.';

  if (healthCheck.isPending) {
    return <Spinner />;
  }

  if (healthCheck.isError) {
    return <Redirecting />;
  }

  const handleNext = async (
    e: React.FormEvent
  ): Promise<SubmitValidationResult> => {
    e.preventDefault();
    if (!hasAcceptedUpdate) {
      setError(errorMessage);
      setIsPageInError(true);
      return {
        isSubmitValid: false
      };
    } else {
      const healthCheckID = healthCheck.data?.id;
      if (!healthCheckID) {
        setError('Health check ID is missing.');
        setIsPageInError(true);
        return {
          isSubmitValid: false
        };
      }
      await healthCheckApiService.runVersionMigration(healthCheckID);
      await queryClient.invalidateQueries({
        queryKey: [CacheKeys.HealthCheck]
      });
      navigate(RoutePath.TaskListPage);
      return {
        isSubmitValid: true
      };
    }
  };

  function onHealthCheckVersionChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHasAcceptedUpdate(e.target.checked);
  }

  return (
    <PageLayout displayNhsAppServicesBackButton={true}>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              {error && (
                <ErrorSummary.Item href="#update-health-check-version-1">
                  {error}
                </ErrorSummary.Item>
              )}
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <form>
        <h1 className="nhsuk-heading-xl">
          Your NHS Health Check online is incomplete
        </h1>
        <p>We have updated the service.</p>
        <p>
          To complete and submit your NHS Health Check online, review the
          following updates.
        </p>

        <ReleaseInfo
          currentVersion={healthCheck.data?.dataModelVersion ?? ''}
        />

        <div
          className={`nhsuk-form-group ${error ? 'nhsuk-form-group--error' : ''}`}
        >
          <CheckboxWrapper
            id="update-health-check-version"
            error={error}
            onChange={onHealthCheckVersionChange}
          >
            <Checkboxes.Box
              {...(error && {
                'aria-describedby': 'update-health-check-version--error-message'
              })}
              value="true"
              checked={hasAcceptedUpdate}
            >
              I understand that I need to review the updates and submit my
              answers to complete the NHS Health Check online.
            </Checkboxes.Box>
          </CheckboxWrapper>
        </div>

        <FormButton onButtonClick={handleNext}>Continue</FormButton>
      </form>
    </PageLayout>
  );
}
