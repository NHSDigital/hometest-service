import { AxiosError, AxiosHeaders } from 'axios';

export default class AxiosResponseBuilder {
  private errorCode: number = 400;
  private message: string = 'error message';

  setErrorCode(errorCode: number): this {
    this.errorCode = errorCode;
    return this;
  }

  setErrorMessage(message: string): this {
    this.message = message;
    return this;
  }

  build(): AxiosError {
    const headers = new AxiosHeaders();
    const config = {
      url: 'test',
      headers
    };
    const error = new AxiosError();
    error.message = `${this.message}`;
    error.response = {
      status: this.errorCode,
      data: `test axios ${this.errorCode}`,
      statusText: 'test',
      headers,
      config
    };

    return error;
  }
}
