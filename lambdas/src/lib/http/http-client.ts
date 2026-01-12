export interface HttpClient {
  get<T>(url: string, headers?: Record<string, string>): Promise<T>;
  post<T>(url: string, body: any, headers?: Record<string, string>): Promise<T>;
}

export class FetchHttpClient implements HttpClient {
  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP GET request failed with status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async post<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP POST request failed with status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}
