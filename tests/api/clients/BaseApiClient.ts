import { APIRequestContext, APIResponse } from '@playwright/test';
import { config } from '../../configuration';
import { EnvironmentVariables } from '../../configuration';

export interface ApiRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: any;
}

export class BaseApiClient {
  protected request: APIRequestContext;
  protected baseURL: string;

  constructor(request: APIRequestContext) {
    this.request = request;
    this.baseURL = config.get(EnvironmentVariables.API_BASE_URL);
  }

  /**
   * Perform GET request
   */
  protected async get(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<APIResponse> {
    const url = this.buildUrl(endpoint, options.params);

    console.log(`[API GET] ${url}`);

    const response = await this.request.get(url, {
      headers: this.buildHeaders(options.headers),
    });

    console.log(`[API Response] Status: ${response.status()}`);

    return response;
  }

  /**
   * Perform POST request
   */
  protected async post(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<APIResponse> {
    const url = this.buildUrl(endpoint, options.params);

    console.log(`[API POST] ${url}`);
    if (options.data) {
      console.log(`[API Request Body]`, JSON.stringify(options.data, null, 2));
    }

    const response = await this.request.post(url, {
      headers: this.buildHeaders(options.headers),
      data: options.data,
    });

    console.log(`[API Response] Status: ${response.status()}`);

    return response;
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    let fullUrl: string;

    if (endpoint.startsWith('/')) {
      const cleanBaseURL = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
      fullUrl = cleanBaseURL + endpoint;
    } else {

      fullUrl = this.baseURL.endsWith('/') ? this.baseURL + endpoint : this.baseURL + '/' + endpoint;
    }

    if (params) {
      const url = new URL(fullUrl);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
      return url.toString();
    }

    return fullUrl;
  }

  /**
   * Build request headers
   */
  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    return {
      ...defaultHeaders,
      ...customHeaders,
    };
  }

  /**
   * Parse JSON response
   */
  protected async parseJsonResponse<T = any>(response: APIResponse): Promise<T> {
    return await response.json();
  }

  /**
   * Validate response status
   */
  protected validateStatus(response: APIResponse, expectedStatus: number = 200): void {
    if (response.status() !== expectedStatus) {
      throw new Error(
        `Expected status ${expectedStatus}, but got ${response.status()}`
      );
    }
  }
}
