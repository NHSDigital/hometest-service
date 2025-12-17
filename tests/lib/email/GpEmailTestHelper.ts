import { type Config, ConfigFactory } from '../../env/config';
import DbOdsCodeService from '../aws/dynamoDB/DbOdsCode';
import DbPatientService from '../aws/dynamoDB/DbPatientService';
import { expect, test } from '../../fixtures/commonFixture';
import { TestEmailService } from './TestEmailService';
import { getOdsCodeData, type OdsItem } from '../../testData/odsCodeData';
import { v4 as uuidv4 } from 'uuid';
import DbHealthCheckService from '../aws/dynamoDB/DbHealthCheckService';

export class GpEmailTestHelper {
  private readonly nhsNumber: string;
  private readonly odsCode: string;
  private readonly dbHealthCheckService: DbHealthCheckService;
  private readonly config: Config = ConfigFactory.getConfig();
  private readonly emailService: TestEmailService = new TestEmailService();
  private existingOdsCode: boolean = false;

  private readonly dbPatientService: DbPatientService = new DbPatientService(
    this.config.name
  );

  private readonly dbOdsCodeService: DbOdsCodeService = new DbOdsCodeService(
    this.config.name
  );

  constructor(nhsNumber: string, odsCode?: string) {
    this.nhsNumber = nhsNumber;
    const envName = ConfigFactory.getConfig().name;
    this.dbHealthCheckService = new DbHealthCheckService(envName);
    if (odsCode) {
      this.odsCode = odsCode;
      this.existingOdsCode = true;
    } else {
      this.odsCode = uuidv4();
    }
  }

  public getOdsCode(): string {
    return this.odsCode;
  }

  public setupGpEmailTest = async (): Promise<void> => {
    if (!this.config.verifyEmails) {
      console.log(
        'Skipping GP email test setup as testEmails is not enabled in the config.'
      );
      return;
    }
    // Create new ODS code with a unique email for the test
    const email = this.buildEmail();
    if (this.existingOdsCode) {
      await this.updateOdsCodeItem(email);
    } else {
      await this.createOdsCodeItem(email);
    }

    // Assign ODS code to patient
    await this.dbPatientService.updatePatientOdsCode(
      this.nhsNumber,
      this.odsCode
    );
  };

  public verifyEmailHasBeenSent = async (): Promise<void> => {
    if (!this.config.verifyEmails) {
      console.log(
        'Skipping GP email test as testEmails is not enabled in the config.'
      );
      return;
    }
    await test.step('Check that email has been sent to GP', async () => {
      const healthCheckId = await this.getHealthCheckId();
      const isEmailRetrieved: boolean = await this.emailService.waitForEmail(
        this.odsCode,
        healthCheckId
      );
      expect(
        isEmailRetrieved,
        `Email with ID ${this.config.name}/${this.odsCode}/${healthCheckId}.html has not been found in S3 bucket.`
      ).toBeTruthy();
    });
  };

  public verifyEmailHasNotBeenSent = async (): Promise<void> => {
    if (!this.config.verifyEmails) {
      console.log(
        'Skipping GP email test as testEmails is not enabled in the config.'
      );
      return;
    }
    await test.step('Check that email has been not sent to GP', async () => {
      const healthCheckId = await this.getHealthCheckId();
      const isEmailRetrieved: boolean = await this.emailService.waitForEmail(
        this.odsCode,
        healthCheckId
      );
      expect(
        isEmailRetrieved,
        `Email with ID ${this.config.name}/${this.odsCode}/${healthCheckId}.html has been found in S3 bucket.`
      ).toBeFalsy();
    });
  };

  public cleanupGpEmailTest = async (deletePatient: boolean): Promise<void> => {
    if (!this.config.verifyEmails) {
      console.log(
        'Skipping GP email test tear down as testEmails is not enabled in the config.'
      );
      return;
    }
    if (deletePatient) {
      await this.dbPatientService.deletePatientItemByNhsNumber(this.nhsNumber);
    } else {
      await this.dbPatientService.updatePatientOdsCode(
        this.nhsNumber,
        'mock_enabled_code'
      );
    }
    if (!this.existingOdsCode) {
      await this.dbOdsCodeService.deleteGpOdsCodeItem(this.odsCode);
    }
    await this.emailService.deleteEmail(
      this.odsCode,
      await this.getHealthCheckId()
    );
  };

  private async createOdsCodeItem(email: string): Promise<void> {
    const odsCodeItemForEmailTesting: OdsItem = getOdsCodeData({
      gpOdsCode: this.odsCode,
      gpEmail: email
    });

    await this.dbOdsCodeService.createGpOdsCodeItem(odsCodeItemForEmailTesting);
  }

  private async updateOdsCodeItem(email: string): Promise<void> {
    await this.dbOdsCodeService.updateNameAndEmail(
      this.odsCode,
      'Automated tests GP name',
      email
    );
  }

  private async getHealthCheckId(): Promise<string> {
    return await this.dbHealthCheckService.getIdByNhsNumber(this.nhsNumber);
  }

  private buildEmail(): string {
    let domain: string;
    if (this.config.integratedEnvironment) {
      domain = `${this.config.name}.nhs-health-check-online.service.nhs.uk`;
    } else {
      domain = 'dhctest.org';
    }
    return `email-verification+${this.config.name}+${this.odsCode}@${domain}`;
  }
}
