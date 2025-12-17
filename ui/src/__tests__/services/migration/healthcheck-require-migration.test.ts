import type { IHealthCheck } from '@dnhc-health-checks/shared';
import healthCheckRequireMigration from '../../../services/migration/healthcheck-require-migration';

describe('healthCheckRequireMigration', () => {
  it('should return false when healthcheck version is greater than current version (major)', () => {
    const healthcheck: IHealthCheck = {
      dataModelVersion: '4.0.0'
    } as IHealthCheck;
    const currentVersion = '3.0.0';

    expect(healthCheckRequireMigration(healthcheck, currentVersion)).toBe(
      false
    );
  });

  it('should return false when healthcheck version is less than current version (minor)', () => {
    const healthcheck: IHealthCheck = {
      dataModelVersion: '2.0.0'
    } as IHealthCheck;
    const currentVersion = '2.1.0';

    expect(healthCheckRequireMigration(healthcheck, currentVersion)).toBe(
      false
    );
  });

  it('should return false when healthcheck version is equal to current version', () => {
    const healthcheck: IHealthCheck = {
      dataModelVersion: '2.0.0'
    } as IHealthCheck;
    const currentVersion = '2.0.0';

    expect(healthCheckRequireMigration(healthcheck, currentVersion)).toBe(
      false
    );
  });

  it('should return true when healthcheck version is less than current version (major)', () => {
    const healthcheck: IHealthCheck = {
      dataModelVersion: '1.0.0'
    } as IHealthCheck;
    const currentVersion = '2.0.0';

    expect(healthCheckRequireMigration(healthcheck, currentVersion)).toBe(true);
  });
});
