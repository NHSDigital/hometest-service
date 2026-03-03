import { useNavigate, useSearchParams } from "react-router-dom";

import PageLayout from "@/layouts/PageLayout";

export default function SuppliersTermsConditionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const supplier = searchParams.get("supplier");

  return (
    <PageLayout onBackButtonClick={() => navigate(-1)}>
      <h1 className="nhsuk-heading-l">{supplier} terms of use</h1>
      <p className="nhsuk-body">tbc</p>
    </PageLayout>
  );
}
