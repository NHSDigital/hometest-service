import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class OrderSubmittedPage extends BasePage {

  readonly orderReference: Locator;
  constructor(page: Page) {
    super(page);
     this.orderReference = page.locator('#reference-number')
     console.log('OrderSubmittedPage initialized', this.orderReference);
  }

  async getOrderReference(): Promise<string> {
    const referenceText = await this.orderReference.textContent();
    const OrderID = referenceText?.match(/\d+/)?.[0];
  if (!OrderID) 
    {
      throw new Error("Order ID not found in the text");  
    }
  return OrderID;
}
}
