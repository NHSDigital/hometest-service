import { type Config, ConfigFactory } from '../../env/config';
import S3Service from '../aws/S3Service';

export class TestEmailService {
  private readonly environmentName: string;
  private readonly s3Service: S3Service;
  private readonly config: Config = ConfigFactory.getConfig();
  private readonly emailBucketName = 'email-verification';

  constructor() {
    this.environmentName = this.config.name;
    this.s3Service = new S3Service(this.environmentName, true);
  }

  public async waitForEmail(
    emailId: string,
    healthCheckId: string
  ): Promise<boolean> {
    return await this.s3Service.waitForAnObjectByKeyName(
      this.emailBucketName,
      `${this.environmentName}/${emailId}/${healthCheckId}.html`
    );
  }

  public async deleteEmail(
    emailId: string,
    healthCheckId: string
  ): Promise<void> {
    const emailObjectKey = `${this.environmentName}/${emailId}/${healthCheckId}.html`;
    console.log(
      `Removing email: ${emailObjectKey} from the bucket ${this.emailBucketName}`
    );
    await this.s3Service.deleteObjectInS3Bucket(
      this.emailBucketName,
      emailObjectKey
    );
  }
}
