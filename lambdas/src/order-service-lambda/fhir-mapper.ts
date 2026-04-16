import type {
  FHIRContactPoint,
  FHIRServiceRequest,
} from "../lib/models/fhir/fhir-service-request-type";
import type { OrderServiceRequest, OrderServiceTelecom } from "./order-service-request-type";

export const mapTelecomToFhirContactPoints = (
  telecom: OrderServiceTelecom[],
): FHIRContactPoint[] => {
  const result: FHIRContactPoint[] = [];
  const mappings: Array<[keyof OrderServiceTelecom, FHIRContactPoint["system"]]> = [
    ["phone", "phone"],
    ["fax", "fax"],
    ["email", "email"],
    ["pager", "pager"],
    ["url", "url"],
    ["sms", "sms"],
    ["other", "other"],
  ];

  telecom.forEach((entry) => {
    mappings.forEach(([key, system]) => {
      const value = entry[key];
      if (value) {
        result.push({ system, value });
      }
    });
  });

  return result;
};

export const buildFhirServiceRequest = (
  orderRequest: OrderServiceRequest,
  patientUid: string,
  orderUid: string,
): FHIRServiceRequest => {
  const { testCode, testDescription, supplierId, patient } = orderRequest;
  const { family, given, text, telecom, address, birthDate } = patient;
  const { use, type, line, city, postalCode, country } = address;

  return {
    resourceType: "ServiceRequest",
    id: orderUid,
    status: "active",
    intent: "order",
    code: {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: testCode,
          display: testDescription,
        },
      ],
      text: testDescription,
    },
    contained: [
      {
        resourceType: "Patient",
        id: patientUid,
        name: [
          {
            use: "official",
            family,
            given,
            text,
          },
        ],
        telecom: mapTelecomToFhirContactPoints(telecom),
        address: [
          {
            use,
            type,
            line,
            city,
            postalCode,
            country,
          },
        ],
        birthDate,
      },
    ],
    subject: {
      reference: `#${patientUid}`,
    },
    requester: {
      reference: "HIV webapp",
    },
    performer: [
      {
        reference: supplierId,
      },
    ],
  };
};
