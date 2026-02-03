"use client";

import { Suspense, use } from "react";

import { AboutService } from "@/components/AboutService";
import { IOrderDetails } from "@/lib/models/order-details";
import { IPatient } from "@/lib/models/patient";
import { OrderStatus } from "@/components/order-status";
import { PageLayout } from "@/components/PageLayout";
import orderDetailsService from "@/lib/services/order-details-service";

interface OrderTrackingPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

function getPatient(): IPatient {
  // hardcoded - will be obtained from logged user later
  return {
    nhsNumber: "2657119018",
    dateOfBirth: "1990-08-11",
  };
}

function OrderContent({
  orderPromise,
}: {
  orderPromise: Promise<IOrderDetails>;
}) {
  const order = use(orderPromise);

  if (!order) {
    return (
      <div role="alert">
        <h1 className="nhsuk-heading-l">There is a problem</h1>
        <p className="nhsuk-body">We could not find this order.</p>
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

export default function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const { orderId } = use(params);
  const patient = getPatient();
  const orderPromise = orderDetailsService.get(orderId, patient);

  return (
    <PageLayout>
      <Suspense
        fallback={
          <div
            className="nhsuk-body nhsuk-u-padding-top-5"
            role="status"
            aria-live="polite"
          >
            <p>Loading...</p>
          </div>
        }
      >
        <OrderContent orderPromise={orderPromise} />
      </Suspense>
    </PageLayout>
  );
}
