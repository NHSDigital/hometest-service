import { type IHealthCheck } from '@dnhc-health-checks/shared';

// Backend equivalent requireMigration present in lambdas/src/lib/health-check-version-migration/health-check-version-migration-service.ts
export default function healthCheckRequireMigration(
  healthCheck: IHealthCheck,
  currentDataModelVersion: string
): boolean {
  const healthCheckModelMajorVersion = parseInt(
    healthCheck.dataModelVersion.split('.')[0],
    10
  );
  const currentDataModelMajorVersion = parseInt(
    currentDataModelVersion.split('.')[0],
    10
  );

  return healthCheckModelMajorVersion < currentDataModelMajorVersion;
}
