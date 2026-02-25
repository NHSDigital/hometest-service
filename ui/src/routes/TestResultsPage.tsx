import { usePageContent } from "@/hooks";
import PageLayout from "@/layouts/PageLayout";
import { RoutePath } from "@/lib/models/route-paths";
import { Patient } from "@/lib/models/patient";
import { useOrderStatusQuery } from "@/lib/queries/order-status-query";
import { useTestResultsQuery } from "@/lib/queries/test-results-query";
import { useAuth } from "@/state/AuthContext";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { OrderStatusHeader } from "@/components/order-status";

function isValidGuid(value: string): boolean {
  const result = z.uuid().safeParse(value);
  return result.success;
}

function TestResultsContent({
  orderId,
  patient,
}: {
  orderId: string;
  patient: Patient;
}) {
  const navigate = useNavigate();
  const trackingPath = RoutePath.OrderTrackingPage.replace(":orderId", orderId);

  const { data: order, isPending: isOrderPending } = useOrderStatusQuery(
    orderId,
    patient,
  );

  const { data: result, isPending: isResultPending } = useTestResultsQuery(
    orderId,
    patient,
  );

  useEffect(() => {
    if (result === null) {
      navigate(trackingPath, { replace: true });
    }
  }, [navigate, result, trackingPath]);

  if (isOrderPending || isResultPending || result === null) {
    return null;
  }

  if (!order) {
    throw new Error("Unable to load test results");
  }

  return (
    <>
      <OrderStatusHeader order={order} />
      {`Result id: ${result?.id}`}
    </>
  );
}

export default function TestResultsPage() {
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

  return (
    <PageLayout>
      <TestResultsContent orderId={orderId} patient={patient} />
    </PageLayout>
  );
}
