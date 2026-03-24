import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { EnvironmentVariables, availableEnvironments, Environment } from "./EnvironmentVariables";

export { EnvironmentVariables };
export type { Environment };

export enum AuthType {
  SANDBOX = "sandbox",
  WIREMOCK = "wiremock",
}

export interface Config {
  uiBaseUrl: string;
  apiBaseUrl: string;
  headless: boolean;
  timeout: number;
  slowMo: number;
  authType: AuthType;
  accessibilityStandards: string;
  reportingOutputDirectory: string;
  enableTracingOnGlobalSetup: boolean;
  wiremockBaseUrl: string;
  chromiumOnly: boolean;
}

export type ConfigInterface = Config;

export class ConfigFactory {
  private static cachedConfig: Config | undefined;
  private static envName: Environment = (process.env.ENV as Environment) || "local";

  public static getConfig(): Config {
    this.envName = (process.env.ENV as Environment) || "local";

    if (!availableEnvironments.includes(this.envName)) {
      throw new Error(
        `Invalid environment: ${this.envName}. Available environments: ${availableEnvironments.join(", ")}`,
      );
    }

    this.cachedConfig ??= this.loadConfiguration();

    return this.cachedConfig;
  }

  private static loadConfiguration(): Config {
    console.log("Loading configuration for the tests...");

    const defaultConfig = this.loadDefaultConfiguration();
    const envConfig = this.readConfigurationFromEnvFile();
    const localConfig = this.readConfigurationFromLocalFile();

    return {
      ...defaultConfig,
      ...envConfig,
      ...localConfig,
    };
  }

  private static loadDefaultConfiguration(): Config {
    return {
      uiBaseUrl: "http://localhost:3000",
      apiBaseUrl: "http://localhost:4000/api",
      headless: true,
      timeout: 30000,
      slowMo: 0,
      authType: (process.env.ENV ?? "local") === "local" ? AuthType.WIREMOCK : AuthType.SANDBOX,
      accessibilityStandards: "wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa",
      reportingOutputDirectory: "tests/testResults",
      enableTracingOnGlobalSetup: false,
      wiremockBaseUrl: "http://localhost:8080",
      chromiumOnly: false,
    };
  }

  private static readConfigurationFromEnvFile(): Partial<Config> {
    const envFilePath = path.resolve(__dirname, `.env.${this.envName}`);

    const result = dotenv.config({ path: envFilePath });

    if (result.error) {
      console.log(
        `No .env file found for environment: ${this.envName}. Using default configuration.`,
      );
      return {};
    }

    console.log(`✅ Loaded configuration from .env.${this.envName}`);

    const partial: Partial<Config> = {};
    const env = process.env;

    if (env[EnvironmentVariables.UI_BASE_URL])
      partial.uiBaseUrl = env[EnvironmentVariables.UI_BASE_URL];
    if (env[EnvironmentVariables.API_BASE_URL])
      partial.apiBaseUrl = env[EnvironmentVariables.API_BASE_URL];
    if (env[EnvironmentVariables.HEADLESS] !== undefined)
      partial.headless = env[EnvironmentVariables.HEADLESS] === "true";
    if (env[EnvironmentVariables.TIMEOUT])
      partial.timeout = parseInt(env[EnvironmentVariables.TIMEOUT], 10);
    if (env[EnvironmentVariables.SLOW_MO])
      partial.slowMo = parseInt(env[EnvironmentVariables.SLOW_MO], 10);
    if (env[EnvironmentVariables.ACCESSIBILITY_STANDARDS])
      partial.accessibilityStandards = env[EnvironmentVariables.ACCESSIBILITY_STANDARDS];
    if (env[EnvironmentVariables.REPORTING_OUTPUT_DIRECTORY])
      partial.reportingOutputDirectory = env[EnvironmentVariables.REPORTING_OUTPUT_DIRECTORY];
    if (env[EnvironmentVariables.AUTH_TYPE])
      partial.authType = env[EnvironmentVariables.AUTH_TYPE] as AuthType;
    if (env[EnvironmentVariables.WIREMOCK_BASE_URL])
      partial.wiremockBaseUrl = env[EnvironmentVariables.WIREMOCK_BASE_URL];
    if (env[EnvironmentVariables.CHROMIUM_ONLY] !== undefined)
      partial.chromiumOnly = env[EnvironmentVariables.CHROMIUM_ONLY] === "true";

    return partial;
  }

  private static readConfigurationFromLocalFile(): Partial<Config> {
    const localFilePath = path.join(__dirname, `./local.json`);

    if (!fs.existsSync(localFilePath)) {
      console.log("No local configuration file found");
      return {};
    }

    return this.readConfigurationFromFile(localFilePath);
  }

  private static readConfigurationFromFile(filePath: string): Partial<Config> {
    try {
      const configurationFileContent = fs.readFileSync(filePath, "utf8");
      return JSON.parse(configurationFileContent) as Partial<Config>;
    } catch (e) {
      console.log(`Error reading configuration file: ${filePath}`, e);
      throw e;
    }
  }

  public static getEnvironment(): Environment {
    return this.envName;
  }
}
