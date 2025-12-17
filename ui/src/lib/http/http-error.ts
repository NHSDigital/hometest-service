export class HttpError extends Error {
  response: unknown;

  constructor(message: string, response: unknown) {
    super(message);
    this.response = response;
    Error.captureStackTrace(this, this.constructor);
  }
}
