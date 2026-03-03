import { Patient } from "@/lib/models/patient";
import { queryKeyNames } from "@/lib/queries/query-keys";
import testResultsService from "@/lib/services/test-results-service";
import { useQuery } from "@tanstack/react-query";

export function useTestResultsQuery(orderId: string, patient: Patient) {
  return useQuery({
    queryKey: [queryKeyNames.testResults, orderId, patient.nhsNumber],
    queryFn: () => testResultsService.get(orderId, patient),
  });
}
