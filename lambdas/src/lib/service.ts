import { type Commons } from './commons';

export class Service {
  readonly className: string;
  readonly commons: Commons;
  readonly logger = {
    info: (msg: string, details?: Record<string, any>) => {
      this.commons.logInfo(this.className, msg, { ...details });
    },
    debug: (msg: string, details?: Record<string, any>) => {
      this.commons.logDebug(this.className, msg, { ...details });
    },
    error: (msg: string, details?: Record<string, any>, security?: boolean) => {
      this.commons.logError(this.className, msg, { ...details }, security);
    }
  };

  constructor(commons: Commons, className: string) {
    this.commons = commons;
    this.className = className;
  }

  getNhcVersion(): string {
    return this.commons.nhcVersion;
  }
}
