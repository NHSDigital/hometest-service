// Takes the raw FHIR Observation
// Extracts orderUid, patientId, supplierId
// Builds the FHIR Task payload exactly as HOTE-1100 requires
// Returns the Task objects
import { Observation } from "fhir/r4";

import { type FHIRTask } from "../lib/models/fhir/fhir-service-request-type";
import {
  extractOrderUidFromFHIRObservation,
  extractPatientIdFromFHIRObservation,
  extractSupplierIdFromFHIRObservation,
} from "./validation-service";

export function buildTaskFromObservation(
  observation: Observation,
  correlationId: string,
): FHIRTask {
  const orderUid = extractOrderUidFromFHIRObservation(observation);
  const patientId = extractPatientIdFromFHIRObservation(observation);
  const supplierId = extractSupplierIdFromFHIRObservation(observation);

  const now = new Date().toISOString();

  return {
    resourceType: "Task",
    identifier: [
      {
        system: "https://fhir.hometest.nhs.uk/Id/order-id",
        value: orderUid,
      },
      {
        system: "https://fhir.hometest.nhs.uk/Id/correlation-id",
        value: correlationId,
      },
    ],
    status: "completed",
    intent: "order",
    basedOn: [
      {
        reference: `ServiceRequest/${orderUid}`,
        type: "ServiceRequest",
      },
    ],
    requester: {
      reference: `Organization/${supplierId}`,
    },
    for: {
      reference: `Patient/${patientId}`,
    },
    businessStatus: {
      coding: [
        {
          system: "https://fhir.hometest.nhs.uk/CodeSystem/result-business-status",
          code: "result-available",
          display: "Result available to patient",
        },
      ],
      text: "result-available",
    },
    authoredOn: now,
    lastModified: now,
  };
}
