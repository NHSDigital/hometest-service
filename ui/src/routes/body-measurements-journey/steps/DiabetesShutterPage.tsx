import { Card } from 'nhsuk-react-components';
import { OpensInNewTabLink } from '../../../lib/components/opens-in-new-tab-link';

export default function DiabetesShutterPage() {
  return (
    <>
      <Card>
        <Card.Content>
          <Card.Heading headingLevel="H1">
            Book a face-to-face appointment with your GP surgery
          </Card.Heading>
        </Card.Content>
      </Card>
      <p>
        Your answers indicate that you might be at risk of type 2 diabetes. This
        is a common health condition.
      </p>
      <p>
        The earlier diabetes is diagnosed and treatment started, the better.
        Early treatment reduces your risk of other health problems.
      </p>
      <p>
        Having some diabetes symptoms doesn’t mean you definitely have the
        condition. Your GP can help you get the right diagnosis and treatment.
      </p>
      <Card cardType="urgent">
        <Card.Heading>Contact your GP</Card.Heading>
        <Card.Content>
          <p>Make an appointment with your GP to discuss your symptoms.</p>
          <p>
            You&apos;ll need a blood test to check your blood sugar (glucose).
          </p>
          <p>
            This helps to diagnose type 2 diabetes and identify prediabetes.
          </p>
        </Card.Content>
      </Card>
      <h2>Find out more</h2>
      <OpensInNewTabLink
        linkHref="https://www.nhs.uk/conditions/type-2-diabetes/"
        linkText="Read NHS guidance on type 2 diabetes"
      />
    </>
  );
}
