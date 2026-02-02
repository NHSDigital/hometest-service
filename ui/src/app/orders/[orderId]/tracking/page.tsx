"use client";

import { Suspense, use } from "react";

import { AboutService } from "@/components/AboutService";
import { Order } from "@/types/order";
import { OrderStatus } from "@/components/order-status";
import { PageLayout } from "@/components/PageLayout";
import { getOrderDetails } from "@/lib/api/orders";

interface OrderTrackingPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

function OrderContent({ orderPromise }: { orderPromise: Promise<Order> }) {
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
            <p>Loading...</p>
          </div>
        }
      >
        <OrderContent orderPromise={orderPromise} />
      </Suspense>
    </PageLayout>
  );
}
