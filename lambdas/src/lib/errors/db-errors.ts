export class DbRecordNotFoundError extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, DbRecordNotFoundError.prototype);
  }
}
