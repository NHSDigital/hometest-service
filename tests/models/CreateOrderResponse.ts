export interface CreateOrderResponse {
  orderUid: string;
  orderReference: string;
  message: string;
}

export class CreateOrderResponseModel {
  orderUid!: string;
  orderReference!: string;
  message!: string;

  constructor(data: CreateOrderResponse) {
    Object.assign(this, data);
  }

  static fromJson(data: CreateOrderResponse): CreateOrderResponseModel {
    return new CreateOrderResponseModel(data);
  }

  isValidResponse(): boolean {
    return (
      !!this.orderUid &&
      !!this.orderReference &&
      !!this.message
    );
  }
}
