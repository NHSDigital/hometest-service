import { Card } from 'nhsuk-react-components';
import PageLayout from '../layouts/PageLayout';
import { GiveFeedbackSection } from '../lib/components/give-feedback-section';

export default function ConsentNotGivenErrorPage() {
  return (
    <PageLayout displayNhsAppServicesBackButton={true}>
      <Card>
        <Card.Content>
          <Card.Heading headingLevel="H1">Contact your GP surgery</Card.Heading>
        </Card.Content>
      </Card>
      <p>
        To use the NHS Home Testing Service, we need to confirm who you are.
        To do this, you need to agree to let NHS login share your information
        with us.
      </p>
      <p>
        If you do not agree to share your NHS login information, contact your GP
        surgery for more information.
      </p>
      <GiveFeedbackSection logAuditEvent={false} />
    </PageLayout>
  );
}
