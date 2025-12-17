import { Checkboxes, ErrorSummary } from 'nhsuk-react-components';
import { useNavigate } from 'react-router-dom';
import { type IHealthCheckService } from '../../services/health-check-service';
import { DefaultHttpClientErrorHandler } from '../../lib/http/http-client-error-handler';
import { type IPatientInfoService } from '../../services/patient-info-service';
import PageLayout from '../../layouts/PageLayout';
import { RoutePath } from '../../lib/models/route-paths';
import { usePageTitleContext } from '../../lib/contexts/PageTitleContext';
import { useQueryClient } from '@tanstack/react-query';
import { CacheKeys } from '../../lib/models/cache-keys';
import FormButton, {
  type SubmitValidationResult
} from '../../lib/components/FormButton';
import CheckboxWrapper from '../../lib/components/wrapper/check-box-wrapper';
import { useAuditEvent } from '../../hooks/eventAuditHook';
import { useEffect, useState } from 'react';
import { termsAndConditionsVersion } from '../../settings';
import { AuditEventType, type IHealthCheck } from '@dnhc-health-checks/shared';
import { OpensInNewTabLink } from '../../lib/components/opens-in-new-tab-link';
import { isEligibilitySectionCompleted } from '../eligibility-journey/EligibilityStepManager';

export interface TermsAndConditionsPageProps {
  healthCheckApiService: IHealthCheckService;
  patientInfoService: IPatientInfoService;
}

export default function TermsAndConditions({
  healthCheckApiService,
  patientInfoService
}: TermsAndConditionsPageProps) {
  const navigate = useNavigate();

  const { triggerAuditEvent } = useAuditEvent();

  useEffect(() => {
    void triggerAuditEvent({
      eventType: AuditEventType.TermsAndConditionsOpened,
      details: { termsAndConditionsVersion: termsAndConditionsVersion }
    });
  }, []);

  const queryClient = useQueryClient();
  const { setIsPageInError } = usePageTitleContext();
  const [hasAcceptedTermsAndConditions, setHasAcceptedTermsAndConditions] =
    useState(false);
  const [error, setError] = useState<string>('');
  const errorMessage = 'Select if you have read and agree to the terms of use';

  const handleNext = async (
    e: React.FormEvent
  ): Promise<SubmitValidationResult> => {
    e.preventDefault();

    if (!hasAcceptedTermsAndConditions) {
      setError(errorMessage);
      setIsPageInError(true);
      return {
        isSubmitValid: false
      };
    } else {
      setError('');
      const { healthChecks } =
        await healthCheckApiService.getHealthChecksByToken();
      const existingHealthChecks = healthChecks || [];

      if (existingHealthChecks.length === 0) {
        await startNewHealthCheck();
      } else {
        await updateExistingPatientTermsVersion(existingHealthChecks);
      }
      return {
        isSubmitValid: true
      };
    }
  };

  async function startNewHealthCheck() {
    try {
      const newHealthCheck = await healthCheckApiService.createHealthCheck();
      queryClient.setQueryData([CacheKeys.HealthCheck], newHealthCheck);
      void triggerAuditEvent({
        eventType: AuditEventType.SectionStartEligibility,
        healthCheck: newHealthCheck,
        patientId: newHealthCheck.patientId
      });
      navigate(RoutePath.EligibilityJourney);
    } catch (error: unknown) {
      void new DefaultHttpClientErrorHandler(navigate).handle(error);
    }
  }

  async function updateExistingPatientTermsVersion(
    healthChecks: IHealthCheck[]
  ) {
    try {
      await patientInfoService.updatePatientInfo({ termsAccepted: true });
      await queryClient.invalidateQueries({
        queryKey: [CacheKeys.PatientInfo]
      });
      if (!isEligibilitySectionCompleted(healthChecks[0])) {
        void triggerAuditEvent({
          eventType: AuditEventType.SectionStartEligibility,
          healthCheck: healthChecks[0],
          patientId: healthChecks[0].patientId
        });
        navigate(RoutePath.EligibilityJourney);
      } else {
        navigate(RoutePath.TaskListPage);
      }
    } catch (error) {
      void new DefaultHttpClientErrorHandler(navigate).handle(
        error,
        healthChecks[0]
      );
    }
  }

  function onTermsAndConditionsChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHasAcceptedTermsAndConditions(e.target.checked);
  }

  return (
    <PageLayout displayNhsAppServicesBackButton={true}>
      {error && (
        <ErrorSummary>
          <ErrorSummary.Title>There is a problem</ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              {error && (
                <ErrorSummary.Item href="#terms-and-conditions-1">
                  {error}
                </ErrorSummary.Item>
              )}
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}
      <form>
        <h1>Accept terms of use</h1>
        <p>
          To continue, confirm that you have read and agree to the{' '}
          <OpensInNewTabLink
            linkHref="https://nhs.uk/nhs-services/online-services/get-your-nhs-health-check-online/legal-and-cookies/terms-of-use"
            linkText=" NHS Health Check online terms of use"
            includeNewTabMessage={true}
          />
        </p>
        <div
          className={`nhsuk-form-group ${error ? 'nhsuk-form-group--error' : ''}`}
        >
          <CheckboxWrapper
            id="terms-and-conditions"
            error={error}
            onChange={onTermsAndConditionsChange}
          >
            <Checkboxes.Box
              {...(error && {
                'aria-describedby': 'terms-and-conditions--error-message'
              })}
              value="true"
              checked={hasAcceptedTermsAndConditions}
            >
              I agree
            </Checkboxes.Box>
          </CheckboxWrapper>
        </div>
        <FormButton onButtonClick={handleNext}>Continue</FormButton>
      </form>
    </PageLayout>
  );
}
