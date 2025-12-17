import path from 'path';
import * as fs from 'fs';

export interface Config {
  name: string;
  labResultsAPI: string;
  backendApiURL: string;
  cognitoApiURL: string;
  notifyCallbackUrl: string;
  mtlsResultsApiUrl: string;
  questionnaireAppURL: string;
  autoExpiryEnabled?: boolean;
  hcExpiryNotificationFlagDefaultValue?: boolean;
  osPlaceMock?: boolean;
  authType: AuthType;
  reportingEnabled?: boolean;
  emisMock?: boolean;
  lsoaEnabled?: boolean;
  townsendTableName?: string;
  verifyEmails?: boolean;
  bulkCleanupEnabled: boolean;
  gpEmailFlagDefaultValue?: boolean;
  integratedEnvironment: boolean;
  mtlsCertificatePath: string;
  mtlsKeyPath: string;
  mtlsPassphrase: string;
  mtlsInvalidCertificatePath: string;
  mtlsInvalidKeyPath: string;
  apimProxyApiUrl: string;
  apimEnvName: string;
  enableTracingOnGlobalSetup: boolean;
  mnsIntegrationEnabled: boolean;

  // local configuration variables
  localNumberOfWorkers: number;
  globalSetupBrowserHeadless: boolean;
  testBrowserHeadless: boolean;
}

export enum AuthType {
  AOS = 'aos',
  MOCKED = 'mocked',
  SANDPIT = 'sandpit'
}

export class ConfigFactory {
  private static cachedConfig: Config | undefined;
  private static envName: string;
  private static awsAccountName: string;

  public static getConfig(): Config {
    this.envName = process.env.ENV ?? 'develop';
    this.awsAccountName = process.env.AWS_ACCOUNT_NAME ?? 'poc';

    this.cachedConfig ??= this.loadConfiguration();

    return this.cachedConfig;
  }

  private static loadConfiguration(): Config {
    console.log('Loading configuration for the tests...');

    const defaultConfig = this.loadDefaultConfiguration(); // start with default configuration
    const envConfig = this.readConfigurationFromEnvFile() as unknown as Config; // override with values from file
    const localConfig = this.readConfigurationFromLocalFile(); // override with local file

    const cachedConfig = {
      ...defaultConfig,
      ...envConfig,
      ...localConfig
    };

    // additional calculations
    if (cachedConfig.integratedEnvironment) {
      cachedConfig.apimProxyApiUrl = cachedConfig.apimEnvName
        ? `https://${cachedConfig.apimEnvName}.api.service.nhs.uk`
        : (undefined as any);
    }
    return cachedConfig;
  }

  private static loadDefaultConfiguration(): Partial<Config> {
    return {
      name: this.envName,
      labResultsAPI: `https://${this.envName}-results-api.dhctest.org`,
      backendApiURL: `https://${this.envName}-api.dhctest.org`,
      questionnaireAppURL: `https://${this.envName}.dhctest.org`,
      cognitoApiURL: `https://${this.envName}-results.auth.eu-west-2.amazoncognito.com`,
      notifyCallbackUrl: `https://${this.envName}-callback-api.dhctest.org`,

      mtlsResultsApiUrl: `https://mtls-${this.envName}-results-api.dhctest.org`,
      mtlsCertificatePath: './certs/mtls/cert.pem',
      mtlsKeyPath: './certs/mtls/key.pem',
      mtlsInvalidCertificatePath: './certs/invalid/invalid-cert.pem',
      mtlsInvalidKeyPath: './certs/invalid/invalid-key.key',
      mtlsPassphrase: '',

      authType: AuthType.MOCKED,
      integratedEnvironment: false,
      reportingEnabled: false,
      autoExpiryEnabled: false,
      osPlaceMock: true,
      mnsIntegrationEnabled: true,
      bulkCleanupEnabled: true
    };
  }

  private static readConfigurationFromEnvFile(): JSON {
    const envFilePath = path.join(
      __dirname,
      `./${this.awsAccountName}/${this.envName.toLowerCase()}.json`
    );

    if (!fs.existsSync(envFilePath)) {
      console.log(
        `No configuration file found for environment: ${this.envName} in AWS account: ${this.awsAccountName}. Using default configuration.`
      );
      return JSON.parse('{}');
    }
    return this.readConfigurationFromFile(envFilePath);
  }

  private static readConfigurationFromLocalFile(): JSON {
    const localFilePath = path.join(__dirname, `./local.json`);
    if (!fs.existsSync(localFilePath)) {
      console.log('No local configuration file found');
      return JSON.parse('{}');
    }
    return this.readConfigurationFromFile(localFilePath);
  }

  private static readConfigurationFromFile(filePath: string): JSON {
    try {
      const configurationFileContent = fs.readFileSync(filePath, 'utf8');
      let configuration = JSON.parse(configurationFileContent);
      return configuration as JSON;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}
