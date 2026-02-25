import { Agent } from 'undici';

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

  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...headers,
      },
      ...(this.dispatcher ? ({ dispatcher: this.dispatcher } as unknown as RequestInit) : {}),
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
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": contentType,
        ...headers,
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
      ...(this.dispatcher ? ({ dispatcher: this.dispatcher } as unknown as RequestInit) : {}),
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
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": contentType,
        ...headers,
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
      ...(this.dispatcher ? ({ dispatcher: this.dispatcher } as unknown as RequestInit) : {}),
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
