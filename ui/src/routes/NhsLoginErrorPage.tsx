import { Card } from 'nhsuk-react-components';
import PageLayout from '../layouts/PageLayout';

export default function NhsLoginErrorPage() {
  return (
    <PageLayout displayNhsAppServicesBackButton={true}>
      <Card>
        <Card.Content>
          <Card.Heading headingLevel="H1">
            Sorry, there is a problem with this service
          </Card.Heading>
        </Card.Content>
      </Card>
      <p>There was an issue with NHS login. This may be temporary.</p>
      <p>Try again later.</p>
    </PageLayout>
  );
}
