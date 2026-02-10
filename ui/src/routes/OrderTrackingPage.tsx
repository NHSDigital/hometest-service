"use client";

import { Suspense, use } from "react";

import { AboutService } from "@/components/AboutService";
import { Order } from "@/types/order";
import { OrderStatus } from "@/components/order-status";
import PageLayout from "@/layouts/PageLayout";
import { getOrderDetails } from "@/lib/api/orders";
import { useParams } from "react-router-dom";
import { useContent } from "@/hooks";

function OrderContent({ orderPromise }: { orderPromise: Promise<Order> }) {
  const order = use(orderPromise);
  const { "order-tracking": content } = useContent();

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
  const { "order-tracking": content } = useContent();

  if (!orderId) {
    return (
      <PageLayout>
        <div role="alert">
          <h1 className="nhsuk-heading-l">{content.error.title}</h1>
          <p className="nhsuk-body">{content.error.orderIdRequired}</p>
        </div>
      </PageLayout>
    );
  }

  const orderPromise = getOrderDetails(orderId);

  return (
    <PageLayout>
      <Suspense
        fallback={
          <div
            className="nhsuk-body nhsuk-u-padding-top-5"
            role="status"
            aria-live="polite"
          >
            <p>{content.loading}</p>
          </div>
        }
      >
        <OrderContent orderPromise={orderPromise} />
      </Suspense>
    </PageLayout>
  );
}
