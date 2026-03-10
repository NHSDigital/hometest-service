import { useNavigate, useSearchParams } from "react-router-dom";

import PageLayout from "@/layouts/PageLayout";
import { SupplierLegalDocumentContent } from "@/components/SupplierLegalDocumentContent";

export default function SuppliersTermsConditionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const supplier = searchParams.get("supplier");

  return (
    <PageLayout onBackButtonClick={() => navigate(-1)}>
      <SupplierLegalDocumentContent supplier={supplier} documentType="terms" />
    </PageLayout>
  );
}
