import { Order } from "@/types/order";

export async function getOrderDetails(orderId: string): Promise<Order> {
  return getMockOrderDetails(orderId) as Order;
}

export function getMockOrderDetails(orderId: string): Order {

  // Mock data for different order statuses
  const mockOrders: Record<string, Order> = {
    "1": {
      id: "1",
      testType: "HIV self-test",
      orderedDate: "2026-01-15",
      referenceNumber: "12345",
      status: "confirmed",
      supplier: "Preventx",
      maxDeliveryDays: 5,
    },
    "2": {
      id: "2",
      testType: "HIV self-test",
      orderedDate: "2026-01-10",
      referenceNumber: "67890",
      status: "dispatched",
      supplier: "SH24",
      dispatchedDate: "2026-01-16",
      maxDeliveryDays: 5,
    },
    "3": {
      id: "3",
      testType: "HIV self-test",
      orderedDate: "2025-05-04",
      referenceNumber: "11223",
      status: "received",
      supplier: "Preventx",
    },
    "4": {
      id: "4",
      testType: "HIV self-test",
      orderedDate: "2025-05-04",
      referenceNumber: "12345",
      status: "ready",
      supplier: "Preventx",
    },
  };

  // Return specific mock data for IDs 1, 2, 3, or default for any other ID
  return (
    mockOrders[orderId] || {
      id: orderId,
      testType: "HIV self-test",
      orderedDate: "2026-01-15",
      referenceNumber: orderId,
      status: "confirmed",
      supplier: "Preventx",
      maxDeliveryDays: 5,
    }
  );
}
