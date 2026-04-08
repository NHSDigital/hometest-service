export interface WireMockMapping {
  priority?: number;
  request: {
    method: string;
    urlPath?: string;
    urlPathPattern?: string;
    headers?: Record<string, Record<string, string>>;
    bodyPatterns?: Array<Record<string, unknown>>;
    queryParameters?: Record<string, Record<string, string>>;
  };
  response: {
    status: number;
    headers?: Record<string, string>;
    jsonBody?: unknown;
    body?: string;
    transformers?: string[];
  };
}

interface WireMockMappingResponse {
  id: string;
  uuid: string;
}

export class WireMockClient {
  private readonly baseUrl: string;
  private readonly createdMappingIds: string[] = [];

  constructor(baseUrl: string = "http://localhost:8080") {
    this.baseUrl = baseUrl;
  }

  async createMapping(mapping: WireMockMapping): Promise<string> {
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const response = await fetch(`${this.baseUrl}/__admin/mappings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapping),
      });

      if (response.ok) {
        const body = (await response.json()) as WireMockMappingResponse;
        this.createdMappingIds.push(body.id);
        return body.id;
      }

      if (response.status === 403 && attempt < maxRetries) {
        console.warn(`⚠️ WireMock admin returned 403 (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      const text = await response.text();
      throw new Error(`Failed to create WireMock mapping: ${response.status} ${text}`);
    }
    throw new Error("Unreachable");
  }

  async deleteMapping(mappingId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/__admin/mappings/${mappingId}`, {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 404) {
      const text = await response.text();
      throw new Error(`Failed to delete WireMock mapping ${mappingId}: ${response.status} ${text}`);
    }
  }

  async deleteAllCreatedMappings(): Promise<void> {
    for (const id of this.createdMappingIds) {
      await this.deleteMapping(id);
    }
    this.createdMappingIds.length = 0;
  }

  async resetAllMappings(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/__admin/mappings/reset`, {
      method: "POST",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to reset WireMock mappings: ${response.status} ${text}`);
    }
    this.createdMappingIds.length = 0;
  }

  async verifyRequest(urlPath: string, method: string = "GET"): Promise<number> {
    const response = await fetch(`${this.baseUrl}/__admin/requests/count`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, urlPath }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to count WireMock requests: ${response.status} ${text}`);
    }

    const body = (await response.json()) as { count: number };
    return body.count;
  }
}
