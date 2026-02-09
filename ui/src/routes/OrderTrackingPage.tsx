"use client";

import { AboutService } from "@/components/AboutService";
import { OrderStatus } from "@/components/order-status";
import PageLayout from "@/layouts/PageLayout";
import { Patient } from "@/lib/models/patient";
import orderDetailsService from "@/lib/services/order-details-service";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
  orderId,
  patient,
}: {
  orderId: string;
  patient: Patient;
}) {
  const { data: order } = useQuery({
    queryKey: ["orderStatus", orderId, patient.nhsNumber],
    queryFn: () => orderDetailsService.get(orderId, patient),
  });

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

  return (
    <PageLayout>
      <OrderContent orderId={orderId} patient={patient} />
    </PageLayout>
  );
}
