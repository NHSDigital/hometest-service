import { backendUrl } from "@/settings";

export interface LaLookupResponse {
  localAuthorityCode: string;
  region: string;
}

class LaLookupService {
  async getByPostcode(postcode: string): Promise<LaLookupResponse> {
    const response = await this.getFromApi(postcode);

    if (!response.ok) {
      throw new Error("Failed to fetch local authority");
    }

    return response.json();
  }

  private async getFromApi(postcode: string): Promise<Response> {
    const url = new URL(`${backendUrl}/test-order/info`);
    url.searchParams.append("postcode", postcode);

    return fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
  }
}

const laLookupService = new LaLookupService();
export default laLookupService;
