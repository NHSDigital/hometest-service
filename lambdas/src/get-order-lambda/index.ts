import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  Bundle,
  BundleEntry,
  CodeableConcept,
  Coding,
  FhirResource,
  Identifier,
  Reference,
  ServiceRequest,
} from "fhir/r4";
import {
  createFhirErrorResponse,
  createFhirResponse,
} from "../lib/fhir-response";

import { init } from "./init";
import { isUUID } from "src/lib/utils";
import middy from "middy";

const { orderDbClient } = init();

const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  // todo validation
  // order has to be uuid
  // lowercase uui?
  const orderId = event.queryStringParameters?.order_id;
  if (!orderId || !isUUID(orderId)) {
    return createFhirErrorResponse(400, "invalid", "Invalid order id");
  }
  // nhs number has to be in valid format
  // maybe it is need to remove whitespaces
  const nhsNumber = event.queryStringParameters?.nhs_number;
  if (!nhsNumber) {
    return createFhirErrorResponse(400, "invalid", "Invalid nhs number");
  }
  // yyyy-mm-dd format, Do it need to handle different formats?
  const dateOfBirth = event.queryStringParameters?.date_of_birth;
  if (!dateOfBirth) {
    return createFhirErrorResponse(400, "invalid", "Invalid date of birth");
  }

  // try catch?
  const order = await orderDbClient.getOrder(
    orderId,
    nhsNumber,
    new Date(dateOfBirth),
  );
  // not found response

  // move to builder

  const identifier: Identifier = {
    system: "https://fhir.hometest.nhs.uk/Id/order-id", // move to const?
    value: `${order.referenceNumber}`,
  };

  const performer: Reference = {
    reference: "Organization/SUPP001", // is the same for any supplier
    type: "Organization",
    display: order.supplierName,
  };

  const code: CodeableConcept = {
    coding: [
      {
        system: "http://snomed.info/sct",
        code: "31676001",
        display: "HIV antigen test", // move to const?
      },
    ],
    text: "HIV antigen test",
  };

  const serviceRequest: ServiceRequest = {
    resourceType: "ServiceRequest",
    id: order.id,
    identifier: [identifier],
    status: "active", // todo?
    intent: "order",
    code: code,
    subject: {
      reference: "#patient-1", //do I need include patient in response?
    },
    requester: {
      reference: "Organization/ORG001", // is it const?
    },
    performer: [performer],
    authoredOn: order.createdAt, // only date, extract from timestamp, utc format?
    extension: [
      {
        url: "https://fhir.hometest.nhs.uk/StructureDefinition/business-status",
        extension: [
          {
            url: "timestamp",
            valueDate: order.timestamp, // only date, extract from timestamp, utc format?
          },
        ],
        valueCodeableConcept: {
          coding: [
            {
              system:
                "https://fhir.hometest.nhs.uk/CodeSystem/order-business-status",
              code: order.status,
              display: "", //todo
            },
          ],
          text: order.status,
        },
      },
    ],
  };

  const bundleEntry: BundleEntry = {
    fullUrl: `urn:uuid:${order.id}`,
    resource: serviceRequest,
  };

  const bundle: Bundle = {
    resourceType: "Bundle",
    type: "searchset",
    total: 1,
    entry: [bundleEntry],
  };

  return createFhirResponse(200);
};

export const handler = middy(lambdaHandler);
