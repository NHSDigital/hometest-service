import { OrderDetails, OrderStatus } from "@/lib/models/order-details";
import { useNavigate, useParams } from "react-router-dom";

import { NegativeTestResult } from "@/components/test-results/NegativeTestResult";
import PageLayout from "@/layouts/PageLayout";
import { Patient } from "@/lib/models/patient";
import { RoutePath } from "@/lib/models/route-paths";
import { isValidGuid } from "@/lib/utils/guid";
import { useAuth } from "@/state/AuthContext";
import { useEffect } from "react";
import { useOrderStatusQuery } from "@/lib/queries/order-status-query";
import { usePageContent } from "@/hooks";
import { useTestResultsQuery } from "@/lib/queries/test-results-query";

function TestResultsContent({
  orderId,
  patient,
  order,
  redirectToTracking,
}: Readonly<{
  orderId: string;
  patient: Patient;
  order: OrderDetails;
  redirectToTracking: () => void;
}>) {
  const {
    data: result,
    isPending: isLoading,
    error: resultError,
  } = useTestResultsQuery(orderId, patient);

  const shouldRedirectToTracking =
    !resultError && (result === null || (result != null && !result.isNormal));

  useEffect(() => {
    if (!isLoading && shouldRedirectToTracking) {
      redirectToTracking();
    }
  }, [isLoading, redirectToTracking, shouldRedirectToTracking]);

  if (isLoading) {
    return null;
  }

  if (resultError) {
    throw resultError;
  }

  if (shouldRedirectToTracking) {
    return null;
  }

  if (!result) {
    throw new Error("Test results not found");
  }

  return <NegativeTestResult order={order} />;
}

function OrderDetailsContent({
  orderId,
  patient,
  redirectToTracking,
}: Readonly<{
  orderId: string;
  patient: Patient;
  redirectToTracking: () => void;
}>) {
  const {
    data: order,
    isPending: isOrderLoading,
    error: orderError,
  } = useOrderStatusQuery(orderId, patient);
  const isOrderNotFound = order === null;
  const isOrderComplete = order?.status === OrderStatus.COMPLETE;
  const shouldRedirectToTracking =
    !orderError && (isOrderNotFound || (order != null && !isOrderComplete));

  useEffect(() => {
    if (!isOrderLoading && shouldRedirectToTracking) {
      redirectToTracking();
    }
  }, [isOrderLoading, redirectToTracking, shouldRedirectToTracking]);

  if (isOrderLoading) {
    return null;
  }

  if (orderError) {
    throw orderError;
  }

  if (shouldRedirectToTracking) {
    return null;
  }

  if (!order) {
    throw new Error("Unable to load order details");
  }

  return (
    <TestResultsContent
      orderId={orderId}
      patient={patient}
      order={order}
      redirectToTracking={redirectToTracking}
    />
  );
}

export default function TestResultsPage() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const content = usePageContent("test-results");

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

  const trackingPath = RoutePath.OrderTrackingPage.replace(":orderId", orderId);
  const redirectToTracking = () => {
    navigate(trackingPath, { replace: true });
  };

  return (
    <PageLayout onBackButtonClick={redirectToTracking}>
      <OrderDetailsContent
        orderId={orderId}
        patient={patient}
        redirectToTracking={redirectToTracking}
      />
    </PageLayout>
  );
}
