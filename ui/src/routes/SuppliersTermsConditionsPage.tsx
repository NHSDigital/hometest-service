import { useNavigate, useSearchParams } from "react-router-dom";

import PageLayout from "@/layouts/PageLayout";
import { SuppliersTermsConditionsContent } from "@/components/SuppliersTermsConditionsContent";

export default function SuppliersTermsConditionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const supplier = searchParams.get("supplier");

  return (
    <PageLayout onBackButtonClick={() => navigate(-1)}>
      <SuppliersTermsConditionsContent supplier={supplier} />
    </PageLayout>
  );
}
