import { useNavigate, useSearchParams } from "react-router-dom";

import PageLayout from "@/layouts/PageLayout";
import { SuppliersPrivacyPolicyContent } from "@/components/SuppliersPrivacyPolicyContent";

export default function SuppliersPrivacyPolicyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const supplier = searchParams.get("supplier");

  return (
    <PageLayout onBackButtonClick={() => navigate(-1)}>
      <SuppliersPrivacyPolicyContent supplier={supplier} />
    </PageLayout>
  );
}
