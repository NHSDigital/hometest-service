import { Card, InsetText } from 'nhsuk-react-components';
import { Fragment } from 'react/jsx-runtime';
import { useEffect, useState } from 'react';
import patientInfoService, {
  type IPatientInfo
} from '../../../services/patient-info-service';
import { OpensInNewTabLink } from '../../../lib/components/opens-in-new-tab-link';
import { useQueryClient } from '@tanstack/react-query';
import { DefaultHttpClientErrorHandler } from '../../../lib/http/http-client-error-handler';
import { useNavigate } from 'react-router';
import { GiveFeedbackSection } from '../../../lib/components/give-feedback-section';
import { type IHealthCheck } from '@dnhc-health-checks/shared';
import { convertToFormattedExpiryDate } from '../../../lib/converters/expiry-date-converter';
import { noLabResultAutoExpireAfterDays } from '../../../settings';

interface BloodTestOrderedPageProps {
  addressLines: string[];
  healthCheck?: IHealthCheck;
  patientId: string;
}

export default function BloodTestOrderedPage({
  addressLines,
  healthCheck,
  patientId
}: Readonly<BloodTestOrderedPageProps>) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [patientInfo, setPatientInfo] = useState<IPatientInfo>();

  const formattedExpiryDate = convertToFormattedExpiryDate(
    healthCheck?.questionnaireCompletionDate,
    noLabResultAutoExpireAfterDays
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response =
          await patientInfoService.getCachedOrFetchPatientInfo(queryClient);
        setPatientInfo(response);
      } catch (error) {
        void new DefaultHttpClientErrorHandler(navigate).handle(
          error,
          healthCheck
        );
      }
    };
    void fetchData();
  }, [queryClient, navigate]);

  return (
    <>
      <Card>
        <Card.Content>
          <Card.Heading headingLevel="h1">
            Your blood test kit has been ordered
          </Card.Heading>
        </Card.Content>
      </Card>
      <div>
        <h2>What happens next</h2>
        <p>We will send a blood test kit with full instructions to:</p>
        <InsetText className="nhsuk-u-margin-bottom-5 nhsuk-u-margin-top-4">
          <p>
            {patientInfo?.firstName} {patientInfo?.lastName}
            <br />
            {addressLines.map((line, index) => (
              <Fragment key={index}>
                {line}
                {index < addressLines.length - 1 && <br />}
              </Fragment>
            ))}
          </p>
        </InsetText>
        <p>
          Your test kit will be sent by Royal Mail. Test kits usually arrive in
          2 to 4 working days.
        </p>
        <p>
          Our NHS partner Thriva will send you email updates about the progress
          of your order. This will be to the email address you use for your NHS
          login.
        </p>
        <p>
          If you provided your mobile phone number, Thriva will also send you
          text message updates.
        </p>
        <p>
          {`Send your blood sample to the lab as soon as you can. Your NHS Health Check will expire if we do not receive results back from the lab by ${formattedExpiryDate}.`}
        </p>
        <h3>Notifications about your NHS Health Check results</h3>
        <p>
          We will contact you to let you know when your results are available.
        </p>
        <p>
          Your results will be shared with your GP and added to your health
          record.
        </p>
        <p>
          If you have the NHS App, check that you have push notifications
          switched on in your account settings.
        </p>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/nhs-services/online-services/get-your-nhs-health-check-online/help-and-support/blood-tests"
            linkText="Blood test help and support"
            includeNewTabMessage={false}
          />
        </p>
        <p>
          <OpensInNewTabLink
            linkHref="https://www.nhs.uk/nhs-app/nhs-app-help-and-support/nhs-app-account-and-settings/managing-nhs-app-notifications/"
            linkText="Manage notification settings"
            includeNewTabMessage={false}
          />
        </p>
      </div>
      <GiveFeedbackSection healthCheck={healthCheck} patientId={patientId} />
    </>
  );
}
