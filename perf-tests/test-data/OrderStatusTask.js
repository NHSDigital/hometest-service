export function buildOrderStatusPayload(orderUid, patientUid, businessStatusText) {
  return {
    resourceType: "Task",
    status: "in-progress",
    intent: "order",
    identifier: [{ value: orderUid }],
    for: { reference: `Patient/${patientUid}` },
    businessStatus: { text: businessStatusText },
    lastModified: new Date().toISOString(),
  };
}
