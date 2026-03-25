import { Bundle, ServiceRequest } from "fhir/r4";
import { OrderDetails, OrderStatus } from "@/lib/models/order-details";

import { FhirConstants } from "../utils/fhir-constants";
import { FhirUtils } from "../utils/fhir-utils";

const MAX_DELIVERY_DAYS = 5;

export class OrderDetailsMapper {
  static mapBundleToOrderDetails(bundle: Bundle): OrderDetails {
    const serviceRequest = FhirUtils.findResource<ServiceRequest>(bundle, "ServiceRequest");

    if (!serviceRequest) {
      throw new Error("ServiceRequest not found in bundle");
    }

    const status = this.extractStatus(serviceRequest);
    const dispatchedDate = this.extractDispatchedDate(serviceRequest);
    const referenceNumber = this.extractReferenceNumber(serviceRequest);

    return {
      id: serviceRequest.id || "",
      orderedDate: serviceRequest.authoredOn || "",
      referenceNumber,
      status,
      supplier: serviceRequest.performer?.[0]?.display || "",
      dispatchedDate,
      maxDeliveryDays: MAX_DELIVERY_DAYS,
    };
  }

  private static extractStatus(serviceRequest: ServiceRequest): OrderStatus {
    const businessStatusExtension = FhirUtils.findExtension(
      serviceRequest,
      FhirConstants.BUSINESS_STATUS_EXTENSION_URL,
    );

    const statusCode = FhirUtils.findCoding(
      businessStatusExtension?.valueCodeableConcept,
      FhirConstants.ORDER_BUSINESS_STATUS_SYSTEM,
    )?.code;

    if (!statusCode) {
      throw new Error("Missing status");
    }

    if (!Object.values(OrderStatus).includes(statusCode as OrderStatus)) {
      throw new Error(`Invalid status: ${statusCode}`);
    }

    return statusCode as OrderStatus;
  }

  private static extractDispatchedDate(serviceRequest: ServiceRequest): string | undefined {
    const businessStatusExtension = FhirUtils.findExtension(
      serviceRequest,
      FhirConstants.BUSINESS_STATUS_EXTENSION_URL,
    );

    const dispatchedDateExtension = FhirUtils.findSubExtension(
      businessStatusExtension,
      FhirConstants.TIMESTAMP_EXTENSION_URL,
    );

    return dispatchedDateExtension?.valueDate;
  }

  private static extractReferenceNumber(serviceRequest: ServiceRequest): string {
    const referenceNumberIdentifier = FhirUtils.findIdentifier(
      serviceRequest,
      FhirConstants.ORDER_ID_SYSTEM,
    );

    return referenceNumberIdentifier?.value || "";
  }
}
