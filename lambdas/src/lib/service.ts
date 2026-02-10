// ALPHA: This file will need revisiting.
export abstract class Service {
  private readonly _name: string
  // private readonly _commons: Commons;
  // ALPHA: Disabling logging for Alpha phase
  // readonly logger = {
  //   info: (msg: string, details?: Record<string, any>) => {
  //     this._commons.logInfo(this._name, msg, { ...details });
  //   },
  //   debug: (msg: string, details?: Record<string, any>) => {
  //     this._commons.logDebug(this._name, msg, { ...details });
  //   },
  //   error: (msg: string, details?: Record<string, any>) => {
  //     this._commons.logError(this._name, msg, { ...details });
  //   }
  // };

  // ALPHA: Removed commons use. TO be reintroduced for logging later.
  constructor(name: string) {
    this._name = name;
    // this._commons = commons;
  }
}
