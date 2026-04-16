import { useNavigate, useSearchParams } from "react-router-dom";

import { SupplierLegalDocumentContent } from "@/components/SupplierLegalDocumentContent";
import PageLayout from "@/layouts/PageLayout";

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
