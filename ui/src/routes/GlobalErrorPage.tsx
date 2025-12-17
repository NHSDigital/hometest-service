import { useRouteError } from 'react-router-dom';
import PageLayout from '../layouts/PageLayout';

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
