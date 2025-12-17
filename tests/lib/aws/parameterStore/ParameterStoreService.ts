import { type Config, ConfigFactory } from '../../../env/config';
import { ParameterStoreClient } from './ParameterStoreClient';

export class ParameterStoreService {
  private readonly client: ParameterStoreClient;
  private readonly config: Config;

  constructor() {
    this.client = new ParameterStoreClient();
    this.config = ConfigFactory.getConfig();
  }

  public async updateEmailToGp(enabled: boolean): Promise<void> {
    console.log(`Turning on ${enabled ? 'on' : 'off'} email notifications.`);
    await this.client.setParameterValue(
      `/${this.config.name}/dhc/gpPracticeEmailEnabled`,
      `${enabled}`
    );
  }

  public async updatePdmIntegration(enabled: boolean): Promise<void> {
    console.log(`Turning on ${enabled ? 'on' : 'off'} PDM integration.`);
    await this.client.setParameterValue(
      `/${this.config.name}/dhc/pdmEnabled`,
      `${enabled}`
    );
  }

  public async updateMnsIntegration(enabled: boolean): Promise<void> {
    console.log(`Turning on ${enabled ? 'on' : 'off'} MNS integration.`);
    await this.client.setParameterValue(
      `/${this.config.name}/dhc/mnsEnabled`,
      `${enabled}`
    );
  }

  public async updateHCExpiryNotification(enabled: boolean): Promise<void> {
    console.log(`Turning on ${enabled ? 'on' : 'off'} HC expiry notification.`);
    await this.client.setParameterValue(
      `/${this.config.name}/dhc/hcExpiryNotificationEnabled`,
      `${enabled}`
    );
  }
}
