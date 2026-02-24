import { backendUrl } from "@/settings";

export interface OrderServiceRequest {
  testCode: string;
  testDescription: string;
  supplierId: string;
  patient: {
    family: string;
    given: string[];
    text: string;
    telecom: Array<{
      phone?: string;
      fax?: string;
      email?: string;
      pager?: string;
      url?: string;
      sms?: string;
      other?: string;
    }>;address: {
      line: string[];
      city: string;
      postalCode: string;
      country: string;
      use: 'home' | 'work' | 'temp' | 'old' | 'billing';
      type: 'postal' | 'physical' | 'both';
    };
    birthDate: string;
    nhsNumber: string;
  };
  consent: boolean;
}

export interface OrderServiceResponse {
  orderUid: string;
  orderReference: string;
  message: string;
}

class OrderService {
  private generateUuid(): string {
    return crypto.randomUUID();
  }

  async submitOrder(request: OrderServiceRequest): Promise<OrderServiceResponse> {
    const url = `${backendUrl}/order`;
    const correlationId = this.generateUuid();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Correlation-ID": correlationId,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to submit order: ${response.status}`
      );
    }

    return response.json();
  }
}

const orderService = new OrderService();
export default orderService;
