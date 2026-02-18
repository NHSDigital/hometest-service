export interface HttpClient {
  get<T>(
    url: string,
    headers?: Record<string, string>,
  ): Promise<T>;
  post<T>(
    url: string,
    body: unknown,
    headers?: Record<string, string>,
    contentType?: string,
  ): Promise<T>;
  postRaw(
    url: string,
    body: unknown,
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
  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, {
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
    body: unknown,
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
    body: unknown,
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
