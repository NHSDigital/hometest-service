import PageLayout from "@/layouts/PageLayout";
import { useContent } from "@/hooks";
import { useLocation } from "react-router-dom";

export default function ServiceErrorPage() {
  const { "service-error": content } = useContent();
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
