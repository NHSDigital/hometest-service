import { useQuery } from "@tanstack/react-query";

import { Patient } from "@/lib/models/patient";
import { queryKeyNames } from "@/lib/queries/query-keys";
import orderDetailsService from "@/lib/services/order-details-service";

export function useOrderStatusQuery(orderId: string, patient: Patient) {
  return useQuery({
    queryKey: [queryKeyNames.orderStatus, orderId, patient.nhsNumber],
    queryFn: () => orderDetailsService.get(orderId, patient),
  });
}
