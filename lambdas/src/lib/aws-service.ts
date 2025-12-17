import { type Commons } from './commons';
import { Service } from './service';

export abstract class AWSService<T> extends Service {
  readonly client: T;
  constructor(commons: Commons, className: string, client: T) {
    super(commons, className);
    this.client = client;
    this.commons.setUpTracing(client);
  }
}
