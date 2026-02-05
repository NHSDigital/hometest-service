import { FetchHttpClient, HttpError } from "./http-client";

global.fetch = jest.fn();

describe("FetchHttpClient", () => {
  let client: FetchHttpClient;

  beforeEach(() => {
    client = new FetchHttpClient();
    jest.clearAllMocks();
  });

  it("get returns JSON on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const result = await client.get<{ ok: boolean }>("https://example.com");

    expect(result).toEqual({ ok: true });
  });

  it("get throws HttpError with body on failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "supplier error",
    });

    await expect(client.get("https://example.com")).rejects.toEqual(
      expect.objectContaining<HttpError>({
        name: "HttpError",
        message: "HTTP GET request failed with status: 500",
        status: 500,
        body: "supplier error",
      }),
    );
  });

  it("post returns JSON on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "abc" }),
    });

    const result = await client.post<{ token: string }>("https://example.com", {
      a: 1,
    });

    expect(result).toEqual({ token: "abc" });
  });

  it("post throws HttpError with body on failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "bad request",
    });

    await expect(client.post("https://example.com", { a: 1 })).rejects.toEqual(
      expect.objectContaining<HttpError>({
        name: "HttpError",
        message: "HTTP POST request failed with status: 400",
        status: 400,
        body: "bad request",
      }),
    );
  });

  it("postRaw returns response on success", async () => {
    const response = {
      ok: true,
      status: 200,
      text: async () => "ok",
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(response);

    const result = await client.postRaw("https://example.com", "payload");

    expect(result).toBe(response);
  });

  it("postRaw throws HttpError with body on failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 502,
      text: async () => "bad gateway",
    });

    await expect(
      client.postRaw("https://example.com", "payload"),
    ).rejects.toEqual(
      expect.objectContaining<HttpError>({
        name: "HttpError",
        message: "HTTP POST request failed with status: 502",
        status: 502,
        body: "bad gateway",
      }),
    );
  });
});
