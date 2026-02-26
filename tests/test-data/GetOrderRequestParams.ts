export interface GetOrderParams extends Record<string, string | number | boolean> {
  nhs_number: string;
  date_of_birth: string;
  order_id: string;
}

export const createGetOrderParams = (
  nhsNumber: string,
  dateOfBirth: string,
  orderId: string
): GetOrderParams => ({
  nhs_number: nhsNumber,
  date_of_birth: dateOfBirth,
  order_id: orderId,
});
