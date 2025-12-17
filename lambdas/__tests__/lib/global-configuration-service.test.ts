import { getParameter } from '@aws-lambda-powertools/parameters/ssm';
import sinon from 'sinon';
import { Commons } from '../../src/lib/commons';
import {
  GlobalConfiguration,
  GlobalConfigurationService
} from '../../src/lib/global-configuration-service';

// Mock getParameter
jest.mock('@aws-lambda-powertools/parameters/ssm', () => ({
  getParameter: jest.fn()
}));

let commonsStub: any;
describe('GlobalConfigurationService', () => {
  const sandbox = sinon.createSandbox();
  commonsStub = sinon.createStubInstance(Commons);

  const ENV_NAME = 'test-env';
  const configurationKey = GlobalConfiguration.gpPracticeEmailEnabled;
  const configurationKeyPath = `/${ENV_NAME}/dhc/${configurationKey}`;

  let config: GlobalConfigurationService;

  beforeEach(() => {
    process.env.ENV_NAME = ENV_NAME;
    config = new GlobalConfigurationService(commonsStub as unknown as Commons);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('isHCExpiryNotificationEnabled should return boolean value', async () => {
    (getParameter as jest.Mock).mockResolvedValue('true');

    const result = await config.isHealthCheckExpiryNotificationEnabled();

    expect(result).toBeTruthy();
  });

  it('isGpPracticeEmailEnabled should return boolean value', async () => {
    (getParameter as jest.Mock).mockResolvedValue('true');

    const result = await config.isGpPracticeEmailEnabled();

    expect(result).toBeTruthy();
  });

  it('isPdmEnabled should return boolean value', async () => {
    (getParameter as jest.Mock).mockResolvedValue('true');

    const result = await config.isPdmEnabled();

    expect(result).toBeTruthy();
  });

  it('isMnsEnabled should return boolean value', async () => {
    (getParameter as jest.Mock).mockResolvedValue('true');

    const result = await config.isMnsEnabled();

    expect(result).toBeTruthy();
  });

  it('should return the configuration value when parameter is found', async () => {
    (getParameter as jest.Mock).mockResolvedValue('true');

    const result = await config.getConfiguration(configurationKey);

    expect(result).toBe('true');
    expect(getParameter).toHaveBeenCalledWith(configurationKeyPath, {
      maxAge: 60
    });
  });

  it('should throw an error and log when parameter is undefined', async () => {
    (getParameter as jest.Mock).mockResolvedValue(undefined);

    await expect(config.getConfiguration(configurationKey)).rejects.toThrow(
      `Couldn't read parameter store key: ${configurationKey}!`
    );
  });

  it('should throw an error and log when getParameter throws', async () => {
    (getParameter as jest.Mock).mockRejectedValue(new Error('SSM error'));

    await expect(config.getConfiguration(configurationKey)).rejects.toThrow(
      `Couldn't read parameter store key: ${configurationKey}!`
    );
  });
});
