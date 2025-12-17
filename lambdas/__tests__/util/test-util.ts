import Sinon from 'ts-sinon';
import { type Commons } from '../../src/lib/commons';

export enum LogMethodNames {
  INFO = 'logInfo',
  DEBUG = 'logDebug',
  ERROR = 'logError'
}
export class TestUtil {
  private readonly commonsStub: Sinon.SinonStubbedInstance<Commons>;
  private readonly serviceClassName: string;
  constructor(
    commonsStub: Sinon.SinonStubbedInstance<Commons>,
    serviceClassName: string
  ) {
    this.commonsStub = commonsStub;
    this.serviceClassName = serviceClassName;
  }

  expectLogProduced(
    message: string,
    details?: any,
    logMethod: string = LogMethodNames.INFO,
    call = 0
  ): void {
    Sinon.assert.calledWith(
      (this.commonsStub[logMethod] as Sinon.SinonStub).getCall(call),
      this.serviceClassName,
      message,
      details
    );
  }
}
