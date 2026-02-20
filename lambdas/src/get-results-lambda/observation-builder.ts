import { CodeableConcept, Observation, Reference } from "fhir/r4";

import { TestResult } from "src/lib/db/test-result-db-client";

export class ObservationBuilder {
  private static readonly OBSERVATION_STATUS = "final" as const;

  public static build(testResult: TestResult): Observation {
    const timestamp = this.buildTimestamp(testResult);

    return {
      resourceType: "Observation",
      id: testResult.id,
      basedOn: [this.buildBasedOnReference(testResult)],
      status: this.OBSERVATION_STATUS,
      code: this.buildHivProcedureCode(),
      subject: this.buildSubjectReference(testResult),
      effectiveDateTime: timestamp,
      issued: timestamp,
      performer: [this.buildPerformer(testResult)],
      valueCodeableConcept: this.buildProcedureResultCode(),
      interpretation: [this.buildProcedureResultInterpretationCode()],
    };
  }

  private static buildTimestamp(testResult: TestResult): string {
    return testResult.created_at.toISOString();
  }

  private static buildBasedOnReference(testResult: TestResult): Reference {
    return {
      reference: `ServiceRequest/${testResult.order_id}`,
    };
  }

  private static buildSubjectReference(testResult: TestResult): Reference {
    return {
      reference: `Patient/${testResult.patient_id}`,
    };
  }

  private static buildPerformer(testResult: TestResult): Reference {
    return {
      reference: `Organization/${testResult.supplier_id}`,
      type: "Organization",
      display: testResult.supplier_name,
    };
  }

  private static buildHivProcedureCode(): CodeableConcept {
    return {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: "31676001",
          display: "HIV antigen test",
        },
      ],
      text: "HIV antigen test",
    };
  }

  private static buildProcedureResultCode(): CodeableConcept {
    return {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: "260415000",
          display: "Not detected",
        },
      ],
    };
  }

  private static buildProcedureResultInterpretationCode(): CodeableConcept {
    return {
      coding: [
        {
          system:
            "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
          code: "N",
          display: "Normal",
        },
      ],
      text: "Normal",
    };
  }
}
