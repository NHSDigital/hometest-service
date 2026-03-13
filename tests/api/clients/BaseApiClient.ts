import { APIRequestContext, APIResponse, expect } from "@playwright/test";
import { ConfigFactory } from "../../configuration/EnvironmentConfiguration";
export interface ApiRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
}

export class BaseApiClient {
  protected request: APIRequestContext;
  protected baseURL: string;

  constructor(request: APIRequestContext) {
    this.request = request;
    this.baseURL = ConfigFactory.getConfig().apiBaseUrl;
  }

  protected async get(endpoint: string, options: ApiRequestOptions = {}): Promise<APIResponse> {
    const url = this.buildUrl(endpoint, options.params);

    console.log(`[API GET] ${url}`);

    const response = await this.request.get(url, {
      headers: this.buildHeaders(options.headers),
    });

    console.log(`[API Response] Status: ${response.status()}`);

    return response;
  }

  protected async post(endpoint: string, options: ApiRequestOptions = {}): Promise<APIResponse> {
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

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    let fullUrl: string;

    if (endpoint.startsWith("/")) {
      const cleanBaseURL = this.baseURL.endsWith("/") ? this.baseURL.slice(0, -1) : this.baseURL;
      fullUrl = cleanBaseURL + endpoint;
    } else {
      fullUrl = this.baseURL.endsWith("/")
        ? this.baseURL + endpoint
        : this.baseURL + "/" + endpoint;
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

  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    return {
      ...defaultHeaders,
      ...customHeaders,
    };
  }

  protected async parseJsonResponse<T = unknown>(response: APIResponse): Promise<T> {
    return await response.json();
  }

  public validateStatus(response: APIResponse, expectedStatus: number = 200): void {
    expect(response.status()).toBe(expectedStatus);
  }
}
