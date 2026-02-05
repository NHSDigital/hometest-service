import { Service } from './service';

export abstract class AWSService<T> extends Service {
  readonly client: T;
  constructor(className: string, client: T) {
    // ALPHA: Removed commons use. To be reintroduced for logging later.
    super(className);
    this.client = client;
    // ALPHA: Disabling logging for Alpha phase
    // this.commons.setUpTracing(client);
  }
}
