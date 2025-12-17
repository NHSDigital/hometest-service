import { Card, HintText } from 'nhsuk-react-components';
import { OpensInNewTabLink } from '../lib/components/opens-in-new-tab-link';
import PageLayout from '../layouts/PageLayout';
import { GiveFeedbackSection } from '../lib/components/give-feedback-section';

export default function BloodTestDataExpiredShutterPage() {
  return (
    <PageLayout displayNhsAppServicesBackButton={true}>
      <Card>
        <Card.Content>
          <Card.Heading headingLevel="h1">
            Book a face-to-face appointment with your GP surgery
          </Card.Heading>
        </Card.Content>
      </Card>
      <p>
        We did not receive the results of your blood test in time. This means
        the time to complete your NHS Health Check online has expired.
      </p>
      <p>
        If you have completed any sections of the health check online, these
        will be saved to your health record.
      </p>
      <p>
        For more information about how we process and protect your data, see the{' '}
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/nhs-services/online-services/get-your-nhs-health-check-online/legal-and-cookies/privacy-policy/"
          linkText="Privacy Policy"
        />
        {''}.
      </p>
      <h2> Complete your NHS Health Check at your GP surgery </h2>
      <p>
        Contact your GP surgery to make an appointment to complete your health
        check with a healthcare professional.
      </p>
      <p>
        In the meantime, here is more information from the NHS to help support
        your health and wellbeing.
      </p>
      <HintText> The following links open in a new tab. </HintText>
      <p>
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/conditions/nhs-health-check/"
          linkText="Find out more about NHS Health Checks"
          includeNewTabMessage={false}
        />
      </p>
      <p>
        <OpensInNewTabLink
          linkHref="https://111.nhs.uk/"
          linkText="Check your symptoms on NHS 111 online"
          includeNewTabMessage={false}
        />
      </p>
      <p>
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/health-assessment-tools/calculate-your-body-mass-index/"
          linkText="BMI Healthy weight calculator"
          includeNewTabMessage={false}
        />
      </p>
      <p>
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/health-assessment-tools/calculate-your-heart-age"
          linkText="Calculate your heart age"
          includeNewTabMessage={false}
        />
      </p>
      <p>
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/live-well/"
          linkText="Healthy lifestyle support"
          includeNewTabMessage={false}
        />
      </p>
      <GiveFeedbackSection />
    </PageLayout>
  );
}
