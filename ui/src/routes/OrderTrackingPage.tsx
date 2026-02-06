"use client";

import { Suspense, use } from "react";

import { AboutService } from "@/components/AboutService";
import { OrderDetails } from "@/lib/models/order-details";
import { OrderStatus } from "@/components/order-status";
import PageLayout from "@/layouts/PageLayout";
import { Patient } from "@/lib/models/patient";
import orderDetailsService from "@/lib/services/order-details-service";
import { useParams } from "react-router-dom";
import { z } from "zod";

function getPatient(): Patient {
  // hardcoded - will be obtained from logged user later
  return {
    nhsNumber: "2657119018",
    dateOfBirth: "1990-08-11",
  };
}

function isValidGuid(value: string): boolean {
  const result = z.uuid().safeParse(value);
  return result.success;
}

function OrderContent({
  orderPromise,
}: {
  orderPromise: Promise<OrderDetails | null>;
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

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const patient = getPatient();

  if (!orderId || !isValidGuid(orderId)) {
    return (
      <PageLayout>
        <div role="alert">
          <h1 className="nhsuk-heading-l">There is a problem</h1>
          <p className="nhsuk-body">The order identifier is not valid.</p>
        </div>
      </PageLayout>
    );
  }

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
