// Takes the raw FHIR Observation
// Extracts orderUid, patientId, supplierId
// Builds the FHIR Task payload exactly as HOTE-1100 requires
// Returns the Task object
import { Observation } from "fhir/r4";

import { InterpretationCode } from "./models";
import { extractInterpretationCodeFromFHIRObservation } from "./validation-service";

// Helper functions to extract identifiers from Observation
function extractOrderUid(observation: Observation): string {
  const reference = observation.basedOn?.[0]?.reference;
  if (!reference) throw new Error("Missing basedOn reference");
  return reference.split("/")[1];
}

function extractPatientId(observation: Observation): string {
  const reference = observation.subject?.reference;
  if (!reference) throw new Error("Missing subject reference");
  return reference.split("/")[1];
}

function extractSupplierId(observation: Observation): string {
  const reference = observation.performer?.[0]?.reference;
  if (!reference) throw new Error("Missing performer reference");
  return reference.split("/")[1];
}

// Build the FHIR Task payload for the status lambda
export function buildTaskFromObservation(observation: Observation) {
  const orderUid = extractOrderUid(observation);
  const patientId = extractPatientId(observation);
  const supplierId = extractSupplierId(observation);

  const now = new Date().toISOString();

  return {
    resourceType: "Task",
    identifier: [
      {
        system: "https://fhir.hometest.nhs.uk/Id/order-id",
        value: orderUid,
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
