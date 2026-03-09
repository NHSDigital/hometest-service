import PageLayout from "@/layouts/PageLayout";
import { useContent } from "@/hooks";
import { useRouteError } from "react-router-dom";

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
