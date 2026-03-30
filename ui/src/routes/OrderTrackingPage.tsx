"use client";

import { useParams } from "react-router-dom";

import { AboutService } from "@/components/AboutService";
import { OrderStatus } from "@/components/order-status";
import { usePageContent } from "@/hooks";
import PageLayout from "@/layouts/PageLayout";
import { Patient } from "@/lib/models/patient";
import { useOrderStatusQuery } from "@/lib/queries/order-status-query";
import { isValidGuid } from "@/lib/utils/guid";
import { useAuth } from "@/state";

function OrderContent({ orderId, patient }: Readonly<{ orderId: string; patient: Patient }>) {
  const content = usePageContent("order-tracking");
  const {
    data: order,
    isPending: isLoading,
    error: orderError,
  } = useOrderStatusQuery(orderId, patient);

  if (isLoading) {
    return null;
  }

  if (orderError) {
    throw orderError;
  }

  if (!order) {
    return (
      <div role="alert">
        <h1 className="nhsuk-heading-l">{content.error.title}</h1>
        <p className="nhsuk-body">{content.error.orderNotFound}</p>
      </div>
    );
  }

  return (
    <>
      <OrderStatus order={order} />
      <AboutService supplier={order.supplier} />
    </>
  );
}

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const content = usePageContent("order-tracking");

  if (!orderId || !isValidGuid(orderId)) {
    return (
      <PageLayout>
        <div role="alert">
          <h1 className="nhsuk-heading-l">{content.error.title}</h1>
          <p className="nhsuk-body">{content.error.orderIdRequired}</p>
        </div>
      </PageLayout>
    );
  }

  const patient: Patient = {
    nhsNumber: user!.nhsNumber,
    dateOfBirth: user!.birthdate,
  };

  return (
    <PageLayout>
      <OrderContent orderId={orderId} patient={patient} />
    </PageLayout>
  );
}
