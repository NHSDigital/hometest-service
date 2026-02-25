import { usePageContent } from "@/hooks";
import PageLayout from "@/layouts/PageLayout";
import { Patient } from "@/lib/models/patient";
import { useAuth } from "@/state/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import orderDetailsService from "@/lib/services/order-details-service";
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
  const { data: order } = useQuery({
    queryKey: ["orderStatus", orderId, patient.nhsNumber],
    queryFn: () => orderDetailsService.get(orderId, patient),
  });

  if (!order) {
    throw new Error("zzz");
  }

  return (
    <>
      <OrderStatusHeader order={order} />
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
