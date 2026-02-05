import PageLayout from "@/layouts/PageLayout";
import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error: unknown = useRouteError();
  console.error(error);

  return (
    <PageLayout>
      <div id="error-page">
        <h1>Oops!</h1>
        <p>Sorry, an unexpected error has occurred.</p>
      </div>
    </PageLayout>
  );
}
