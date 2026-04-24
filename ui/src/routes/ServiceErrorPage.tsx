import { useLocation } from "react-router-dom";

import { useContent, usePageTitle } from "@/hooks";
import PageLayout from "@/layouts/PageLayout";

export default function ServiceErrorPage() {
  const { "service-error": content } = useContent();
  usePageTitle(content.pageTitle);
  const { state } = useLocation();

  if (state?.errorMessage) {
    console.error("[ServiceErrorPage]", state.errorMessage);
  }

  return (
    <PageLayout>
      <div id="error-page">
        <h1>{content.title}</h1>
        <p>{content.message}</p>
      </div>
    </PageLayout>
  );
}
