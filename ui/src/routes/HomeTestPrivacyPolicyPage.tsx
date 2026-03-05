"use client";

import { LegalDocumentContent } from "@/components/LegalDocumentContent";
import PageLayout from "@/layouts/PageLayout";
import { useContent } from "@/hooks";
import { useNavigate } from "react-router-dom";

export default function HomeTestPrivacyPolicyPage() {
  const navigate = useNavigate();
  const { "home-test-privacy-policy": content } = useContent();

  return (
    <PageLayout onBackButtonClick={() => navigate(-1)}>
      <LegalDocumentContent content={content} />
    </PageLayout>
  );
}
