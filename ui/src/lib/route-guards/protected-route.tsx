/**
 * `ProtectedRoute` component ensuring users can access certain routes
 * based on their health check status and patient information.
 * Uses route conditions from `route-conditions.ts` to determine access.
 * Redirects users to appropriate pages like Task List Page or Start Health Check Page if access is denied.
 * Handles common redirection logic, including T&C, Auto-Expired, and Shutter Pages.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams
} from 'react-router-dom';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import axios, { HttpStatusCode } from 'axios';
import { type IHealthCheckService } from '../../services/health-check-service';
import {
  type IPatientInfo,
  type IPatientInfoService
} from '../../services/patient-info-service';
import {
  getStepUrl,
  JourneyStepNames,
  pageTitlesMap,
  RoutePath
} from '../models/route-paths';
import { CacheKeys, CacheStaleTimes } from '../models/cache-keys';
import { routeConditionsForLoggedUser } from './route-conditions';
import { useAuditEvent } from '../../hooks/eventAuditHook';
import {
  type IHealthCheck,
  AuditEventType,
  HealthCheckSteps,
  isStepEqualOrAfter
} from '@dnhc-health-checks/shared';
import { Spinner } from '../pages/spinner';
import { homeTestingDataModelVersion } from '../../settings';
import { getPageTitle } from '../components/dynamic-page-title';
import healthCheckRequireMigration from '../../services/migration/healthcheck-require-migration';
import { rum } from '../rum/rum-client';
import { RumEventType } from '../models/rum-event-type';
import { isEligibilitySectionCompleted } from '../../routes/eligibility-journey/EligibilityStepManager';
import { shutterActions, type ShutterAction } from './shutter-actions';

const fetchHealthCheck = async (
  queryClient: QueryClient,
  healthCheckApiService: IHealthCheckService
) =>
  queryClient.fetchQuery({
    queryKey: [CacheKeys.HealthCheck],
    queryFn: async () => {
      const res = await healthCheckApiService.getHealthChecksByToken();
      return res.healthChecks.length > 0 ? res.healthChecks[0] : null;
    },
    staleTime: CacheStaleTimes.HealthCheck
  });

interface ProtectedRouteProps {
  healthCheckApiService: IHealthCheckService;
  patientInfoService: IPatientInfoService;
}

const ProtectedRoute = ({
  healthCheckApiService,
  patientInfoService
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pathname: currentPath } = useLocation();
  const { triggerAuditEvent } = useAuditEvent();
  const [searchParams] = useSearchParams();
  const currentStep = searchParams.get('step');

  const [isLoading, setIsLoading] = useState(true);
  // Ensure the terms and conditions or expired screen checks are performed only once on page refresh
  const [termsAndConditionsCheckDone, setTermsAndConditionsCheckDone] =
    useState(false);
  const [healthCheckExpiredCheckDone, setHealthCheckExpiredCheckDone] =
    useState(false);

  const determineRedirectPath = useCallback(async (): Promise<string> => {
    let healthCheck: IHealthCheck | null = null;
    try {
      healthCheck = await fetchHealthCheck(queryClient, healthCheckApiService);
      if (healthCheck) {
        const healthCheckExpiredCheck = await handleHealthCheckExpired(
          healthCheck,
          healthCheckExpiredCheckDone,
          setHealthCheckExpiredCheckDone,
          triggerAuditEvent
        );

        if (healthCheckExpiredCheck !== null) {
          return healthCheckExpiredCheck;
        }

        const shutterCondition = isUserShuttered(
          healthCheck,
          currentPath,
          currentStep
        );

        if (shutterCondition) {
          return getStepUrl(
            shutterCondition.navigation.route,
            shutterCondition.navigation.step
          );
        }

        if (
          healthCheckRequireMigration(
            healthCheck,
            homeTestingDataModelVersion
          ) &&
          healthCheck.step === HealthCheckSteps.INIT
        ) {
          return RoutePath.HealthCheckVersionMigration;
        }
      } else {
        queryClient.removeQueries({ queryKey: [CacheKeys.HealthCheck] });
      }

      const termsAndConditionsCheck = await handleTermsAndConditions(
        termsAndConditionsCheckDone,
        currentPath,
        patientInfoService,
        queryClient,
        setTermsAndConditionsCheckDone
      );

      if (termsAndConditionsCheck !== null) {
        return termsAndConditionsCheck;
      }

      if (!healthCheck) {
        return RoutePath.StartHealthCheckPage;
      }

      const routeCondition =
        routeConditionsForLoggedUser[currentPath as RoutePath];
      if (routeCondition?.canAccess?.(healthCheck)) {
        return currentPath;
      }

      if (
        isStepEqualOrAfter(healthCheck.step, HealthCheckSteps.GP_UPDATE_SUCCESS)
      ) {
        return RoutePath.MainResultsPage;
      }

      if (
        isStepEqualOrAfter(
          healthCheck.step,
          HealthCheckSteps.LAB_ORDERS_SCHEDULED
        )
      ) {
        return getStepUrl(
          RoutePath.BloodTestJourney,
          JourneyStepNames.BloodTestOrderedPage
        );
      }

      if (!isEligibilitySectionCompleted(healthCheck)) {
        if (!currentPath.startsWith(RoutePath.EligibilityJourney)) {
          void triggerAuditEvent({
            eventType: AuditEventType.SectionStartEligibility,
            healthCheck: healthCheck,
            patientId: healthCheck.patientId
          });
        }
        return RoutePath.EligibilityJourney;
      }

      return RoutePath.TaskListPage;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        switch (error.response?.status) {
          case HttpStatusCode.Unauthorized:
            return RoutePath.HomePage;
          case HttpStatusCode.NotFound:
            return RoutePath.StartHealthCheckPage;
          default:
            await rum.recordErrorEvent({
              eventType: RumEventType.UNEXPECTED_ERROR,
              errorMessage: error.message,
              errorDetails: error.response?.data as unknown,
              healthCheckId: healthCheck?.id,
              patientId: healthCheck?.patientId
            });
            return RoutePath.UnexpectedErrorPage;
        }
      }
      await rum.recordErrorEvent({
        eventType: RumEventType.UNEXPECTED_ERROR,
        errorMessage:
          error instanceof Error && error.message
            ? error.message
            : 'Unknown error when determining redirect path',
        healthCheckId: healthCheck?.id,
        patientId: healthCheck?.patientId
      });
      return RoutePath.UnexpectedErrorPage;
    }
  }, [
    queryClient,
    healthCheckApiService,
    termsAndConditionsCheckDone,
    currentPath,
    healthCheckExpiredCheckDone,
    triggerAuditEvent,
    currentStep,
    patientInfoService
  ]);

  const determineRedirectPathRef = useRef(determineRedirectPath);
  determineRedirectPathRef.current = determineRedirectPath;
  useEffect(() => {
    const handleRedirect = async () => {
      const redirectPath = await determineRedirectPathRef.current();
      setIsLoading(false);

      // Avoid redirect if already on the correct path
      if (currentPath === redirectPath) {
        return;
      }

      // Avoid redirect loop from TermsAndConditions to StartHealthCheckPage
      if (
        (currentPath as RoutePath) === RoutePath.TermsAndConditions &&
        (redirectPath as RoutePath) === RoutePath.StartHealthCheckPage
      ) {
        return;
      }

      navigate(redirectPath, { replace: true });
    };

    void handleRedirect();
  }, [currentPath, currentStep, navigate]);

  return isLoading ? <Spinner /> : <Outlet />;
};

const handleHealthCheckExpired = async (
  healthCheck: IHealthCheck,
  healthCheckExpiredCheckDone: boolean,
  setHealthCheckExpiredCheckDone: (value: boolean) => void,
  triggerAuditEvent: (event: {
    eventType: AuditEventType;
    healthCheck: IHealthCheck;
    patientId: string | undefined;
  }) => Promise<void>
): Promise<RoutePath | null> => {
  if (!healthCheckExpiredCheckDone) {
    setHealthCheckExpiredCheckDone(true);
    switch (healthCheck.step) {
      case HealthCheckSteps.AUTO_EXPIRED: {
        await triggerAuditEvent({
          eventType: AuditEventType.ExpiredScreenOpened,
          healthCheck: healthCheck,
          patientId: healthCheck.patientId
        });
        return RoutePath.HealthCheckExpiredPage;
      }
      case HealthCheckSteps.AUTO_EXPIRED_BLOOD_ORDERED:
      case HealthCheckSteps.AUTO_EXPIRED_BLOOD_RECEIVED:
      case HealthCheckSteps.AUTO_EXPIRED_BLOOD_FINAL:
      case HealthCheckSteps.AUTO_EXPIRED_BLOOD_NOT_ORDERED:
      case HealthCheckSteps.AUTO_EXPIRED_NO_BLOOD_FINAL: {
        await triggerAuditEvent({
          eventType: AuditEventType.BloodTestExpiredScreenOpened,
          healthCheck: healthCheck,
          patientId: healthCheck.patientId
        });
        return RoutePath.BloodTestDataExpiredShutterPage;
      }
      default:
        return null;
    }
  }
  return null;
};

const isUserShuttered = (
  healthCheck: IHealthCheck,
  currentPath: string,
  currentStep: string | null
): ShutterAction | null => {
  if (healthCheck.questionnaire) {
    for (const shutterAction of shutterActions) {
      if (shutterAction.check(healthCheck.questionnaire)) {
        const pageHeading = (pageTitlesMap as Record<string, string>)[
          currentStep ?? currentPath
        ];
        document.title = getPageTitle(pageHeading);
        return shutterAction;
      }
    }
  }
  return null;
};

const handleTermsAndConditions = async (
  termsAndConditionsCheckDone: boolean,
  currentPath: string,
  patientInfoService: IPatientInfoService,
  queryClient: QueryClient,
  setTermsAndConditionsCheckDone: (value: boolean) => void
): Promise<RoutePath | null> => {
  if (
    !termsAndConditionsCheckDone ||
    (currentPath as RoutePath) === RoutePath.TermsAndConditions ||
    (currentPath as RoutePath) === RoutePath.HomePage
  ) {
    setTermsAndConditionsCheckDone(true);
    let patientInfo: IPatientInfo | null;
    try {
      patientInfo =
        await patientInfoService.getCachedOrFetchPatientInfo(queryClient);
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === HttpStatusCode.NotFound
      ) {
        patientInfo = null;
        queryClient.removeQueries({ queryKey: [CacheKeys.PatientInfo] });
      } else {
        throw error;
      }
    }
    if (!patientInfo) {
      return RoutePath.StartHealthCheckPage;
    }
    if (!patientInfo.termsAccepted) {
      return RoutePath.TermsAndConditions;
    }
  }
  return null;
};

export default ProtectedRoute;
