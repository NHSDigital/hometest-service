import PageLayout from "@/layouts/PageLayout";
import { useRouteError } from "react-router-dom";
import { useContent } from "@/hooks";

export default function ErrorPage() {
  const error: unknown = useRouteError();
  const { "global-error": content } = useContent();
  console.error(error);

  return (
    <PageLayout>
      <div id="error-page">
        <h1>{content.title}</h1>
        <p>{content.message}</p>
      </div>
    </PageLayout>
  );
}
