import { SecretManagerService } from './aws/SecretManagerService';
import { userPasswordGeneric, userPasswordDhc, OTP } from './../credentials';
import { type Config, ConfigFactory } from '../env/config';
import * as fs from 'fs';
import path from 'path';

export interface Keys {
  passwordGeneric: string;
  passwordDHC: string;
  OTP: string;
}

const config: Config = ConfigFactory.getConfig();

export class CredentialsHelper {
  private async getCredentialsFromSecretManager(): Promise<Keys> {
    const secretManagerService = new SecretManagerService();
    const secretValue = `nhc/${config.authType}/user-credentials`;

    const keys = await secretManagerService.getSecretValue(secretValue);

    return JSON.parse(keys) as Keys;
  }

  public async addCredentialsToEnvVariable(): Promise<void> {
    if (fs.existsSync(`./credentials.ts`) && userPasswordGeneric) {
      console.log('Credentials taken from credentials.ts file');
      process.env.GENERIC_PASS = userPasswordGeneric as string;
      process.env.DHC_PASS = userPasswordDhc as string;
      process.env.OTP = OTP as string;
    } else if (config.integratedEnvironment) {
      console.log('Credentials taken from Secret manager');
      const credentials = await this.getCredentialsFromSecretManager();
      process.env.GENERIC_PASS = credentials.passwordGeneric;
      process.env.DHC_PASS = credentials.passwordDHC;
      process.env.OTP = credentials.OTP;
    }
  }

  private saveToFile(content: string, filePath: string): void {
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, 'utf8');
  }

  public async getMtlsSecretsAndSaveCertificates(): Promise<void> {
    const awsAccountName = process.env.AWS_ACCOUNT_NAME ?? 'poc';
    const secretManagerService = new SecretManagerService();
    const certSecretName = `nhc/${awsAccountName}/mtls-results-client-certificate`;
    const keySecretName = `nhc/${awsAccountName}/mtls-results-client-private-key`;

    const certificateValue =
      await secretManagerService.getSecretValue(certSecretName);
    const keyValue = await secretManagerService.getSecretValue(keySecretName);

    const certPath = config.mtlsCertificatePath;
    const keyPath = config.mtlsKeyPath;

    this.saveToFile(certificateValue, certPath);
    this.saveToFile(keyValue, keyPath);
  }

  public async cleanupMtlsCertificates(): Promise<void> {
    const certPath = config.mtlsCertificatePath;
    const keyPath = config.mtlsKeyPath;

    try {
      if (fs.existsSync(certPath)) {
        await fs.promises.unlink(certPath);
        console.log(`Deleted certificate file: ${certPath}`);
      }
      if (fs.existsSync(keyPath)) {
        await fs.promises.unlink(keyPath);
        console.log(`Deleted key file: ${keyPath}`);
      }
    } catch (error) {
      console.error('Error during cleanup of mTLS certificates:', error);
    }
  }
}
