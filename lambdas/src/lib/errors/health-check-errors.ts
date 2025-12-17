export class HealthCheckNotCompleted extends Error {
  public readonly uncompletedSections: string[];
  constructor(msg: string, uncompletedSections: string[]) {
    super(msg);
    this.uncompletedSections = uncompletedSections;
    Object.setPrototypeOf(this, HealthCheckNotCompleted.prototype);
  }
}

export class HealthCheckNotFound extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, HealthCheckNotFound.prototype);
  }
}

export class HealthCheckStepError extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, HealthCheckStepError.prototype);
  }
}

export class HealthCheckSubmittedError extends HealthCheckStepError {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, HealthCheckSubmittedError.prototype);
  }
}

export class HealthCheckExpiredError extends HealthCheckStepError {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, HealthCheckExpiredError.prototype);
  }
}

export class CannotUpdateBloodTestError extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, CannotUpdateBloodTestError.prototype);
  }
}

export class CannotPlaceLabOrderError extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, CannotPlaceLabOrderError.prototype);
  }
}
