import * as dotenv from 'dotenv';
import * as path from 'path';
import { EnvironmentVariables, availableEnvironments, Environment } from './environment-variables';

export class Configuration {
  private static instance: Configuration;
  private readonly defaultConfiguration: Map<EnvironmentVariables, string>;
  private readonly environment: Environment;

  private constructor() {
    // Check if ENV is provided, default to 'dev' for local development
    const env = process.env.ENV || 'dev';

    // Validate environment
    if (!availableEnvironments.includes(env as Environment)) {
      throw new Error(
        `Invalid environment: ${env}. Available environments: ${availableEnvironments.join(', ')}`
      );
    }

    this.environment = env as Environment;

    // Load environment-specific .env file
    const envFilePath = path.resolve(__dirname, `.env.${this.environment}`);
    const result = dotenv.config({ path: envFilePath });

    if (result.error) {
      console.warn(`Warning: Could not load ${envFilePath}. Using environment variables and defaults.`);
    } else {
      console.log(`✅ Loaded configuration from .env.${this.environment}`);
    }

    // Initialize default configuration
    this.defaultConfiguration = new Map([
      [EnvironmentVariables.UI_BASE_URL, 'http://localhost:3000'],
      [EnvironmentVariables.API_BASE_URL, 'http://localhost:4000/api'],
      [EnvironmentVariables.HEADLESS, 'true'],
      [EnvironmentVariables.TIMEOUT, '30000'],
      [EnvironmentVariables.SLOW_MO, '0'],
      [EnvironmentVariables.ACCESSIBILITY_STANDARDS, 'wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa'],
      [EnvironmentVariables.REPORTING_OUTPUT_DIRECTORY, 'testResults'],
    ]);
  }

  public static getInstance(): Configuration {
    if (!Configuration.instance) {
      Configuration.instance = new Configuration();
    }
    return Configuration.instance;
  }

  public get(key: EnvironmentVariables): string {
    // First, check if the variable exists in process.env
    const envValue = process.env[key];
    if (envValue !== undefined) {
      return envValue;
    }

    // If not found in process.env, check default configuration
    const defaultValue = this.defaultConfiguration.get(key);
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    // If neither found, throw an error
    throw new Error(
      `Configuration error: Environment variable '${key}' is not set and has no default value.`
    );
  }

  public getEnvironment(): Environment {
    return this.environment;
  }

  public getBoolean(key: EnvironmentVariables): boolean {
    const value = this.get(key);
    return value.toLowerCase() === 'true';
  }

  public getNumber(key: EnvironmentVariables): number {
    const value = this.get(key);
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      throw new Error(`Configuration error: '${key}' value '${value}' is not a valid number.`);
    }
    return numValue;
  }
}

export const config = Configuration.getInstance();
