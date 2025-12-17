import { DynamoDBService } from './DynamoDBService';

export interface SessionItem {
  sessionId: string;
  accessToken: string;
  nhsNumber: string;
  odsCode: string;
  ttl: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default class DbSessionService extends DynamoDBService {
  private getTableName(): string {
    return `${this.envName}-nhc-session-db`;
  }

  private async getAllSessionItems(): Promise<SessionItem[]> {
    return await this.getAllItems(this.getTableName());
  }

  async getSessionById(sessionId: string): Promise<SessionItem> {
    const response = (await this.getJsonItemByPartitionKey(
      this.getTableName(),
      'sessionId',
      sessionId
    )) as SessionItem;
    console.log(`Session db item for ID '${sessionId}'`, { response });
    return response;
  }

  async getSessionsByNhsNumber(nhsNumber: string): Promise<SessionItem[]> {
    return (await this.getAllSessionItems()).filter(
      (item: SessionItem) => item.nhsNumber === nhsNumber
    );
  }

  async getLatestSessionItemsByNhsNumber(
    nhsNumber: string
  ): Promise<SessionItem> {
    const sessionItems = await this.getSessionsByNhsNumber(nhsNumber);
    if (sessionItems.length === 0) {
      throw new Error(`No session items found for NHS number: ${nhsNumber}`);
    }
    const latestSession = sessionItems.reduce(function (prev, current) {
      return prev.ttl > current.ttl ? prev : current;
    });
    console.log(`HealthCheck db items for nhsNum '${nhsNumber}':`, {
      latestSession
    });
    return latestSession;
  }

  async updatePatientSessionDetails(
    sessionId: string,
    firstName: string,
    lastName: string
  ): Promise<void> {
    await this.updateItemByPartitionKey(
      this.getTableName(),
      'sessionId',
      sessionId,
      'firstName',
      firstName,
      'S',
      'S'
    );

    await this.updateItemByPartitionKey(
      this.getTableName(),
      'sessionId',
      sessionId,
      'lastName',
      lastName,
      'S',
      'S'
    );

    console.log(
      `Updated firstName and lastName of patient for session '${sessionId}'`
    );
  }

  async deleteSessionBySessionId(sessionId: string): Promise<void> {
    await this.deleteItemByPartitionKey(
      this.getTableName(),
      'sessionId',
      sessionId
    );
  }

  async deleteLatestSessionByNhsNumber(nhsNumber: string): Promise<void> {
    const sessionItem = await this.getLatestSessionItemsByNhsNumber(nhsNumber);
    await this.deleteSessionBySessionId(sessionItem.sessionId);
  }

  async deleteAllSessionByNhsNumber(nhsNumber: string): Promise<void> {
    const sessionItems = await this.getSessionsByNhsNumber(nhsNumber);
    await Promise.all(
      sessionItems.map(async (item: SessionItem) => {
        await this.deleteSessionBySessionId(item.sessionId);
      })
    );
  }

  async createSession(session: SessionItem): Promise<void> {
    await this.putItem(this.getTableName(), session);
  }
}
