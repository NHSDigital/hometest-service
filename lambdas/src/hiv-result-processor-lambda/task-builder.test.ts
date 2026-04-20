import { Observation, Task } from "fhir/r4";

import { buildTaskFromObservation } from "./task-builder";

describe("buildTaskFromObservation", () => {
  const fixedDate = new Date("2026-04-17T10:20:30.000Z");
  const baseObservation: Pick<Observation, "resourceType" | "status" | "code"> = {
    resourceType: "Observation",
    status: "final",
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "75622-1",
        },
      ],
    },
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(fixedDate.getTime());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("builds the expected task from a valid observation", () => {
    const observation: Observation = {
      ...baseObservation,
      basedOn: [{ reference: "ServiceRequest/order-123" }],
      subject: { reference: "Patient/patient-456" },
      performer: [{ reference: "Organization/supplier-789" }],
    };

    const result = buildTaskFromObservation(observation) as Task;

    expect(result).toEqual({
      resourceType: "Task",
      identifier: [
        {
          system: "https://fhir.hometest.nhs.uk/Id/order-id",
          value: "order-123",
        },
      ],
      status: "completed",
      intent: "order",
      basedOn: [
        {
          reference: "ServiceRequest/order-123",
          type: "ServiceRequest",
        },
      ],
      requester: {
        reference: "Organization/supplier-789",
      },
      for: {
        reference: "Patient/patient-456",
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
      authoredOn: "2026-04-17T10:20:30.000Z",
      lastModified: "2026-04-17T10:20:30.000Z",
    });
  });

  it("throws when basedOn reference is missing", () => {
    const observation: Observation = {
      ...baseObservation,
      subject: { reference: "Patient/patient-456" },
      performer: [{ reference: "Organization/supplier-789" }],
    };

    expect(() => buildTaskFromObservation(observation)).toThrow("Missing basedOn reference");
  });

  it("throws when subject reference is missing", () => {
    const observation: Observation = {
      ...baseObservation,
      basedOn: [{ reference: "ServiceRequest/order-123" }],
      performer: [{ reference: "Organization/supplier-789" }],
    };

    expect(() => buildTaskFromObservation(observation)).toThrow("Missing subject reference");
  });

  it("throws when performer reference is missing", () => {
    const observation: Observation = {
      ...baseObservation,
      basedOn: [{ reference: "ServiceRequest/order-123" }],
      subject: { reference: "Patient/patient-456" },
    };

    expect(() => buildTaskFromObservation(observation)).toThrow("Missing performer reference");
  });
});
