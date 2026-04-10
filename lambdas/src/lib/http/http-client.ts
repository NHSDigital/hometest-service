import { Agent, fetch as undiciFetch } from 'undici';

// Use undici's own fetch so that the Agent dispatcher is compatible at runtime.
// Cast to the global fetch type to avoid type conflicts between undici and undici-types.
const fetchFn = undiciFetch as unknown as typeof fetch;

export interface HttpClient {
  get<T>(
    url: string,
    headers?: Record<string, string>,
  ): Promise<T>;
  post<T>(
    url: string,
    body: any,
    headers?: Record<string, string>,
    contentType?: string,
  ): Promise<T>;
  postRaw(
    url: string,
    body: any,
    headers?: Record<string, string>,
    contentType?: string,
  ): Promise<Response>;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class FetchHttpClient implements HttpClient {
  private readonly dispatcher?: Agent;

  constructor(options?: { rejectUnauthorized?: boolean }) {
    if (options?.rejectUnauthorized === false) {
      this.dispatcher = new Agent({ connect: { rejectUnauthorized: false } });
    }
  }

  // When a custom dispatcher is set, use undici's own fetch so the Agent instance
  // is compatible. Without a dispatcher, fall back to the global fetch so that
  // unit-test mocks on global.fetch continue to work.
  private doFetch(url: string, init: RequestInit): Promise<Response> {
    if (this.dispatcher) {
      return fetchFn(url, {
        ...init,
        ...(({ dispatcher: this.dispatcher } as unknown as RequestInit)),
      });
    }
    return fetch(url, init);
  }

  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await this.doFetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new HttpError(
        `HTTP GET request failed with status: ${response.status}`,
        response.status,
        errorText,
      );
    }

    return (await response.json()) as T;
  }

  async post<T>(
    url: string,
    body: any,
    headers?: Record<string, string>,
    contentType: string = "application/json",
  ): Promise<T> {
    const response = await this.doFetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": contentType,
        ...headers,
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new HttpError(
        `HTTP POST request failed with status: ${response.status}`,
        response.status,
        errorText,
      );
    }

    return (await response.json()) as T;
  }

  async postRaw(
    url: string,
    body: any,
    headers?: Record<string, string>,
    contentType: string = "application/json",
  ): Promise<Response> {
    const response = await this.doFetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": contentType,
        ...headers,
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new HttpError(
        `HTTP POST request failed with status: ${response.status}`,
        response.status,
        errorText,
      );
    }

    return response;
  }
}
