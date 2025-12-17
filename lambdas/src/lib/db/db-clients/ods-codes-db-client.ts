import { type DbClient } from '../db-client';
import { type IGpOdsCode } from '../../models/ods-codes/ods-code';
import { DbTable } from '../db-tables';
import { Service } from '../../service';
import { type Commons } from '../../commons';
import {
  type EntityUpdateParams,
  type EntityFetchParams
} from '../entity-update-params';

export interface IOdsCodesDbClient {
  getOdsCodeStatus: (code: string) => Promise<IGpOdsCode>;
  getDisabledCodes: () => Promise<IGpOdsCode[]>;
}

export class OdsCodesDbClient extends Service implements IOdsCodesDbClient {
  readonly dbClient: DbClient;
  constructor(commons: Commons, dbClient: DbClient) {
    super(commons, 'OdsCodesDbClient');
    this.dbClient = dbClient;
  }

  public async getOdsCodeStatus(code: string): Promise<IGpOdsCode> {
    try {
      this.logger.info('about to fetch gp ods code status', {
        code
      });

      const fetchParams: EntityFetchParams = {
        table: DbTable.GpOdsCodes,
        partitionKeyValue: code
      };
      const codeStatus =
        await this.dbClient.getRecordById<IGpOdsCode>(fetchParams);

      return codeStatus;
    } catch {
      this.logger.error('the ods code could not be found in the table', {
        code
      });
      return {
        gpOdsCode: code,
        enabled: false
      } as unknown as IGpOdsCode;
    }
  }

  public async getDisabledCodes(): Promise<IGpOdsCode[]> {
    this.logger.info('about to fetch gp ods disabled codes');

    const codes = await this.dbClient.getAllRecords<IGpOdsCode>({
      table: DbTable.GpOdsCodes,
      filterBy: { key: 'enabled', value: false }
    });

    return codes;
  }

  public async updateCode(
    code: string,
    updates: Record<string, any>
  ): Promise<void> {
    this.logger.info('about to update gp ods code', { code });

    const updateParams: EntityUpdateParams = {
      table: DbTable.GpOdsCodes,
      partitionKeyValue: code,
      updates
    };

    await this.dbClient.updateRecordProperties(updateParams);
  }
}
