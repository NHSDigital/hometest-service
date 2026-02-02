"use client";

import { useEffect, useState } from "react";

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

export default function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrderData() {
      try {
        const { orderId } = await params;
        const data = await getOrderDetails(orderId);
        setOrder(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchOrderData();
  }, [params]);

  if (loading) {
    return (
      <PageLayout>
        <div className="nhsuk-u-padding-top-5">
          <p>Loading order details...</p>
        </div>
      </PageLayout>
    );
  }

  if (error || !order) {
    return (
      <PageLayout>
        <div
          className="nhsuk-error-summary"
          role="alert"
          aria-labelledby="error-summary-title"
        >
          <h2 className="nhsuk-error-summary__title" id="error-summary-title">
            There is a problem
          </h2>
          <div className="nhsuk-error-summary__body">
            <p>
              We could not find this order. Please check your order reference
              and try again.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <OrderStatus order={order} />
      <AboutService supplier={order.supplier} />
    </PageLayout>
  );
}
