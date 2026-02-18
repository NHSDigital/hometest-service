import axios, {
  type RawAxiosResponseHeaders,
  type AddressFamily,
  type LookupAddress,
  type RawAxiosRequestHeaders
} from 'axios';
import { Resolver } from 'node:dns';

export interface HttpErrorDetails {
  httpCode?: number;
  responseData?: unknown;
  cause?: unknown;
}

export interface HttpClientOptions {
  timeoutInSeconds?: number;
  additionalDnsServers?: string[];
}

export interface CustomLookupOptions {
  family?: AddressFamily;
  hints?: number;
  all?: boolean;
}

export type CustomLookupType = (
  hostname: string,
  options: CustomLookupOptions,
  callback: (
    err: Error | null,
    address: LookupAddress | LookupAddress[],
    family?: AddressFamily
  ) => void
) => void;

export class HttpClient {
  private readonly options: HttpClientOptions | undefined;
  private readonly customLookup: CustomLookupType | undefined;
  // ALPHA: Removed commons use. To be reintroduced for logging later.
  constructor(options?: HttpClientOptions) {
    this.options = options;
    if (
      options?.additionalDnsServers !== undefined &&
      options.additionalDnsServers.length > 0
    ) {
      this.customLookup = this.getCustomLookup(options.additionalDnsServers);
    }
  }

  async doPostRequestWithStatus<TBody, TResponse>(
    endpointUrl: string,
    body: TBody,
    headers: RawAxiosRequestHeaders = {}
  ): Promise<{ data: TResponse; httpCode: number }> {
    try {
      const timeoutInSeconds = this.options?.timeoutInSeconds ?? 30;

      const response = await axios.post<TResponse>(endpointUrl, body, {
        headers,
        timeout: timeoutInSeconds * 1000,
        lookup: this.customLookup
      });
      return { httpCode: response.status, data: response.data };
    } catch (error: unknown) {
      const errorDetails = this.createErrorDetailsObject(error);
      throw this.createErrorWithDetails('Post', errorDetails);
    }
  }

  async doPostRequest<TBody, TResponse>(
    endpointUrl: string,
    body: TBody,
    headers: RawAxiosRequestHeaders = {}
  ): Promise<TResponse> {
    const response = await this.doPostRequestWithStatus<TBody, TResponse>(
      endpointUrl,
      body,
      headers
    );
    return response.data;
  }

  async postRequest<TBody, TResponse>(
    endpointUrl: string,
    body: TBody,
    headers: RawAxiosRequestHeaders = {}
  ): Promise<TResponse> {
    const defaultHeaders = this.getDefaultRequestHeaders();
    return await this.doPostRequest(endpointUrl, body, {
      ...defaultHeaders,
      ...headers
    });
  }

  async doPutRequestWithStatus<TBody, TResponse>(
    endpointUrl: string,
    body: TBody,
    headers: RawAxiosRequestHeaders = {}
  ): Promise<{ data: TResponse; httpCode: number }> {
    try {
      const timeoutInSeconds = this.options?.timeoutInSeconds ?? 30;
      const response = await axios.put<TResponse>(endpointUrl, body, {
        headers,
        timeout: timeoutInSeconds * 1000,
        lookup: this.customLookup
      });

      return { httpCode: response.status, data: response.data };
    } catch (error: unknown) {
      const errorDetails = this.createErrorDetailsObject(error);
      throw this.createErrorWithDetails('Put', errorDetails);
    }
  }

  async putRequest<TBody, TResponse>(
    endpointUrl: string,
    body: TBody,
    headers: RawAxiosRequestHeaders = {}
  ): Promise<TResponse> {
    const defaultHeaders = this.getDefaultRequestHeaders();
    const response = await this.doPutRequestWithStatus<TBody, TResponse>(
      endpointUrl,
      body,
      {
        ...defaultHeaders,
        ...headers
      }
    );

    return response.data;
  }

  async deleteRequest<TResponse>(
    endpointUrl: string,
    headers: RawAxiosRequestHeaders = {}
  ): Promise<TResponse> {
    try {
      const defaultHeaders = this.getDefaultRequestHeaders();
      const response = await axios.delete<TResponse>(endpointUrl, {
        headers: { ...defaultHeaders, ...headers },
        lookup: this.customLookup
      });

      return response.data;
    } catch (error: unknown) {
      const errorDetails = this.createErrorDetailsObject(error);
      throw this.createErrorWithDetails('Delete', errorDetails);
    }
  }

  async doGetRequestWithHeaders<TResponse>(
    endpointUrl: string,
    headers: RawAxiosRequestHeaders = {}
  ): Promise<{ data: TResponse; headers: RawAxiosResponseHeaders }> {

    const response = await axios.get<TResponse>(endpointUrl, {
      withCredentials: false,
      headers,
      lookup: this.customLookup
    });

    return { headers: response.headers, data: response.data };
  }

  async getRequest<TResponse>(
    endpointUrl: string,
    headers: RawAxiosRequestHeaders = {}
  ): Promise<TResponse> {
    try {
      const defaultHeaders = this.getDefaultRequestHeaders();
      const response = await this.doGetRequestWithHeaders<TResponse>(
        endpointUrl,
        { ...defaultHeaders, ...headers }
      );

      return response.data;
    } catch (error: unknown) {
      const errDetails = HttpClient.getHttpErrorDetails(error);
      const _errJson = HttpClient.isHttpError(error) ? (error as { toJSON: () => unknown }).toJSON() : error;

      throw new Error('Get API call failure', {
        cause: {
          details: {
            httpCode: errDetails.httpCode,
            responseData: errDetails.responseData,
            underlyingCause: (error as Error).cause
          }
        }
      });
    }
  }

  private getDefaultRequestHeaders(): RawAxiosRequestHeaders {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };
  }

  private getCustomLookup(additionalDnsServers: string[]): CustomLookupType {
    const resolver = new Resolver();
    resolver.setServers(additionalDnsServers.concat(resolver.getServers()));

    const customLookup: CustomLookupType = (hostname, options, callback) => {
      // Resolve both IPv4 and IPv6 addresses
      if (options.family === 6) {
        resolver.resolve6(hostname, (err, addresses) => {
          if (err) {
            callback(err, []);
            return;
          }
          callback(null, addresses[0], 6);
        });
      } else {
        resolver.resolve4(hostname, (err, addresses) => {
          if (err) {
            callback(err, []);
            return;
          }
          callback(null, addresses[0], 4);
        });
      }
    };
    return customLookup;
  }

  private removeGetParams(urlString: string): string {
    const url = new URL(urlString);
    return url.origin.concat(url.pathname);
  }

  private createErrorDetailsObject(error: unknown): Record<string, unknown> {
    const err = error as { message?: string; code?: string; response?: { status?: number; data?: unknown }; cause?: unknown };
    return {
      errorMessage: err.message,
      errorCode: err.code,
      responseStatus: err.response?.status,
      responseData: err.response?.data,
      errorCause: err.cause,
      isHttpError: true
    };
  }

  private createErrorWithDetails(
    apiMethod: string,
    errorDetails: Record<string, unknown>
  ): Error {
    return new Error(`${apiMethod} API call failure`, {
      cause: {
        details: errorDetails
      }
    });
  }

  static isHttpError(error: unknown): boolean {
    const err = error as { cause?: { details?: { isHttpError?: boolean } } };
    return (
      axios.isAxiosError(error) || err.cause?.details?.isHttpError === true
    );
  }

  static getHttpErrorDetails(error: unknown): HttpErrorDetails {
    const err = error as { cause?: { details?: { responseStatus?: number; responseData?: unknown; errorCause?: unknown } } };
    return {
      httpCode: err.cause?.details?.responseStatus,
      responseData: err.cause?.details?.responseData,
      cause: err.cause?.details?.errorCause
    };
  }
}
