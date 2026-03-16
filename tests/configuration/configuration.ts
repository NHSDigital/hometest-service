import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { EnvironmentVariables, availableEnvironments, Environment } from './environment-variables';

export { EnvironmentVariables };

export enum AuthType {
  SANDBOX = 'sandbox'
}

export interface ConfigInterface {
  uiBaseUrl: string;
  apiBaseUrl: string;
  headless: boolean;
  timeout: number;
  slowMo: number;
  authType: AuthType;
  accessibilityStandards: string;
  reportingOutputDirectory: string;
  externalLinkSexualHealthClinic: string;
  externalLinkNearestAE: string;
  externalLinkHivAidsInfo: string;
  enableTracingOnGlobalSetup: boolean;
}

export class ConfigFactory {
  private static cachedConfig: ConfigInterface | undefined;
  private static envName: Environment;

  public static getConfig(): ConfigInterface {
    this.envName = (process.env.ENV as Environment) || 'local';

    // Validate environment
    if (!availableEnvironments.includes(this.envName)) {
      throw new Error(
        `Invalid environment: ${this.envName}. Available environments: ${availableEnvironments.join(', ')}`
      );
    }

    this.cachedConfig ??= this.loadConfiguration();

    return this.cachedConfig;
  }

  private static loadConfiguration(): ConfigInterface {
    console.log('Loading configuration for the tests...');

    const defaultConfig = this.loadDefaultConfiguration(); // start with default configuration
    const envConfig = this.readConfigurationFromEnvFile(); // override with values from .env file
    const localConfig = this.readConfigurationFromLocalFile(); // override with local JSON file
    const cliEnvConfig = this.readConfigurationFromProcessEnv(); // highest priority: CLI env vars

    const cachedConfig = {
      ...defaultConfig,
      ...envConfig,
      ...localConfig,
      ...cliEnvConfig
    };

    return cachedConfig;
  }

  /**
   * Read configuration directly from process.env (CLI environment variables)
   * This has the highest priority and overrides all other configuration sources
   */
  private static readConfigurationFromProcessEnv(): Partial<ConfigInterface> {
    const config: Partial<ConfigInterface> = {};

    // Only include values that are explicitly set in environment
    if (process.env[EnvironmentVariables.UI_BASE_URL]) {
      config.uiBaseUrl = process.env[EnvironmentVariables.UI_BASE_URL];
    }
    if (process.env[EnvironmentVariables.API_BASE_URL]) {
      config.apiBaseUrl = process.env[EnvironmentVariables.API_BASE_URL];
    }
    if (process.env[EnvironmentVariables.HEADLESS] !== undefined) {
      config.headless = process.env[EnvironmentVariables.HEADLESS] === 'true';
    }
    if (process.env[EnvironmentVariables.TIMEOUT]) {
      config.timeout = parseInt(process.env[EnvironmentVariables.TIMEOUT], 10);
    }
    if (process.env[EnvironmentVariables.SLOW_MO]) {
      config.slowMo = parseInt(process.env[EnvironmentVariables.SLOW_MO], 10);
    }
    if (process.env[EnvironmentVariables.ACCESSIBILITY_STANDARDS]) {
      config.accessibilityStandards = process.env[EnvironmentVariables.ACCESSIBILITY_STANDARDS];
    }

    if (Object.keys(config).length > 0) {
      console.log('✅ Applied CLI environment variable overrides:', Object.keys(config).join(', '));
    }

    return config;
  }

  private static loadDefaultConfiguration(): ConfigInterface {
    return {
      uiBaseUrl: 'http://localhost:3000',
      apiBaseUrl: 'http://localhost:4000/api',
      headless: true,
      timeout: 30000,
      slowMo: 0,
      authType: AuthType.SANDBOX,
      accessibilityStandards: 'wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa',
      reportingOutputDirectory: 'tests/testResults',
      externalLinkSexualHealthClinic: 'https://www.nhs.uk/service-search/sexual-health-services/find-a-sexual-health-clinic/',
      externalLinkNearestAE: 'https://www.nhs.uk/service-search/find-an-accident-and-emergency-service/',
      externalLinkHivAidsInfo: 'https://www.nhs.uk/conditions/hiv-and-aids/',
      enableTracingOnGlobalSetup: false,
    };
  }

  private static readConfigurationFromEnvFile(): Partial<ConfigInterface> {
    const envFilePath = path.resolve(__dirname, `.env.${this.envName}`);

    const result = dotenv.config({ path: envFilePath });

    if (result.error) {
      console.log(
        `No .env file found for environment: ${this.envName}. Using default configuration.`
      );
      return {};
    }

    console.log(`✅ Loaded configuration from .env.${this.envName}`);

    // Map environment variables to config interface
    return {
      uiBaseUrl: process.env[EnvironmentVariables.UI_BASE_URL],
      apiBaseUrl: process.env[EnvironmentVariables.API_BASE_URL],
      headless: process.env[EnvironmentVariables.HEADLESS] === 'true',
      timeout: process.env[EnvironmentVariables.TIMEOUT]
        ? parseInt(process.env[EnvironmentVariables.TIMEOUT], 10)
        : undefined,
      slowMo: process.env[EnvironmentVariables.SLOW_MO]
        ? parseInt(process.env[EnvironmentVariables.SLOW_MO], 10)
        : undefined,
      accessibilityStandards: process.env[EnvironmentVariables.ACCESSIBILITY_STANDARDS],
      reportingOutputDirectory: process.env[EnvironmentVariables.REPORTING_OUTPUT_DIRECTORY],
      externalLinkSexualHealthClinic: process.env[EnvironmentVariables.EXTERNAL_LINK_SEXUAL_HEALTH_CLINIC],
      externalLinkNearestAE: process.env[EnvironmentVariables.EXTERNAL_LINK_NEAREST_AE],
      externalLinkHivAidsInfo: process.env[EnvironmentVariables.EXTERNAL_LINK_HIV_AIDS_INFO],
    };
  }

  private static readConfigurationFromLocalFile(): Partial<ConfigInterface> {
    const localFilePath = path.join(__dirname, `./local.json`);

    if (!fs.existsSync(localFilePath)) {
      console.log('No local configuration file found');
      return {};
    }

    return this.readConfigurationFromFile(localFilePath);
  }

  private static readConfigurationFromFile(filePath: string): Partial<ConfigInterface> {
    try {
      const configurationFileContent = fs.readFileSync(filePath, 'utf8');
      const configuration = JSON.parse(configurationFileContent);
      return configuration as Partial<ConfigInterface>;
    } catch (e) {
      console.log(`Error reading configuration file: ${filePath}`, e);
      throw e;
    }
  }

  public static get(key: keyof ConfigInterface): any {
    const config = this.getConfig();
    return config[key];
  }

  public static getEnvironment(): Environment {
    return this.envName;
  }
}

// Backward compatibility wrapper
class ConfigWrapper {
  get(key: EnvironmentVariables): string {
    const config = ConfigFactory.getConfig();

    switch (key) {
      case EnvironmentVariables.UI_BASE_URL:
        return config.uiBaseUrl;
      case EnvironmentVariables.API_BASE_URL:
        return config.apiBaseUrl;
      case EnvironmentVariables.HEADLESS:
        return String(config.headless);
      case EnvironmentVariables.TIMEOUT:
        return String(config.timeout);
      case EnvironmentVariables.SLOW_MO:
        return String(config.slowMo);
      case EnvironmentVariables.ACCESSIBILITY_STANDARDS:
        return config.accessibilityStandards || 'wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa';
      case EnvironmentVariables.REPORTING_OUTPUT_DIRECTORY:
        return config.reportingOutputDirectory;
      case EnvironmentVariables.EXTERNAL_LINK_SEXUAL_HEALTH_CLINIC:
        return config.externalLinkSexualHealthClinic;
      case EnvironmentVariables.EXTERNAL_LINK_NEAREST_AE:
        return config.externalLinkNearestAE;
      case EnvironmentVariables.EXTERNAL_LINK_HIV_AIDS_INFO:
        return config.externalLinkHivAidsInfo;
      default:
        throw new Error(`Unknown configuration key: ${key}`);
    }
  }

  getBoolean(key: EnvironmentVariables): boolean {
    const value = this.get(key);
    return value.toLowerCase() === 'true';
  }

  getNumber(key: EnvironmentVariables): number {
    const value = this.get(key);
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      throw new Error(`Configuration error: '${key}' value '${value}' is not a valid number.`);
    }
    return numValue;
  }

  getEnvironment(): Environment {
    return ConfigFactory.getEnvironment();
  }
}

export const config = new ConfigWrapper();
