import { SummaryList } from 'nhsuk-react-components';
import patientInfoService, {
  type IPatientInfo
} from '../../../services/patient-info-service';
import { useEffect, useState } from 'react';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';
import { useQueryClient } from '@tanstack/react-query';
import { DefaultHttpClientErrorHandler } from '../../../lib/http/http-client-error-handler';
import { useNavigate } from 'react-router';
import { type IHealthCheckBloodTestOrder } from '@dnhc-health-checks/shared';
import BloodTestSummaryRows from './blood-test-summary-rows';

export interface ConfirmDetailsPageProps {
  bloodTestOrder?: IHealthCheckBloodTestOrder;
  submitAnswers: () => Promise<SubmitValidationResult>;
}

export default function ConfirmDetailsPage({
  bloodTestOrder,
  submitAnswers
}: Readonly<ConfirmDetailsPageProps>) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [patientInfo, setPatientInfo] = useState<IPatientInfo>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response =
          await patientInfoService.getCachedOrFetchPatientInfo(queryClient);
        setPatientInfo(response);
      } catch (error) {
        void new DefaultHttpClientErrorHandler(navigate).handle(error);
      }
    };
    void fetchData();
  }, [queryClient, navigate]);

  const name = patientInfo?.firstName + ' ' + patientInfo?.lastName;
  return (
    <>
      <h1>Confirm your details</h1>
      <p>This is the address we will send your blood test kit to.</p>
      <p>
        We will update you about your blood test on the email address you use
        for your NHS login.
      </p>
      <p>
        If you provided your mobile telephone number, we will send you text
        message updates about your test.
      </p>
      <p>
        Text message and email updates about your blood test will come from the
        NHS partner Thriva.
      </p>
      <div>
        <SummaryList>
          <BloodTestSummaryRows bloodTestAnswers={bloodTestOrder} name={name} />
        </SummaryList>
      </div>
      <FormButton onButtonClick={submitAnswers}>
        Confirm and order blood test
      </FormButton>
    </>
  );
}
