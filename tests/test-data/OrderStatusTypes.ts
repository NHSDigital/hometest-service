export interface OrderStatusTaskPayload {
  resourceType: 'Task';
  status: string;
  intent: string;
  basedOn: Array<{ reference: string }>;
  for: { reference: string };
  businessStatus?: { text: string };
  lastModified?: string;
}
