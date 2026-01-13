import {Commons} from "./commons";

export abstract class Service {
  private readonly _name: string
  private readonly _commons: Commons;
  readonly logger = {
    info: (msg: string, details?: Record<string, any>) => {
      this._commons.logInfo(this._name, msg, { ...details });
    },
    debug: (msg: string, details?: Record<string, any>) => {
      this._commons.logDebug(this._name, msg, { ...details });
    },
    error: (msg: string, details?: Record<string, any>) => {
      this._commons.logError(this._name, msg, { ...details });
    }
  };

  constructor(name: string, commons: Commons) {
    this._name = name;
    this._commons = commons;
  }
}
