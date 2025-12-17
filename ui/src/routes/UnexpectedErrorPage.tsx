import { Card } from 'nhsuk-react-components';
import PageLayout from '../layouts/PageLayout';

export default function UnexpectedErrorPage() {
  return (
    <PageLayout>
      <div id="unexpected-error-page">
        <Card>
          <Card.Content>
            <Card.Heading headingLevel="H1">
              Sorry, there is a problem with this service
            </Card.Heading>
          </Card.Content>
        </Card>
        <p>
          There is a problem with the NHS Home Testing Service right now.
        </p>
        <p>Try again later.</p>
        <p>
          If you have completed any sections of the NHS Home Testing Service, we
          have saved your answers.
        </p>
      </div>
    </PageLayout>
  );
}
