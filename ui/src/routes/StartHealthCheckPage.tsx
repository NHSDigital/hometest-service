import { Button } from 'nhsuk-react-components';
import { Link, useNavigate } from 'react-router-dom';
import PageLayout from '../layouts/PageLayout';
import { RoutePath } from '../lib/models/route-paths';

export default function StartHealthCheckPage() {
  const navigate = useNavigate();

  function startNow() {
    navigate(RoutePath.TermsAndConditions);
  }

  return (
    <PageLayout displayNhsAppServicesBackButton={true}>
      <h1 className="nhsuk-heading-xl">Get your NHS Health Check online</h1>
      <p>
        Take the NHS Health Check online at home, at your own pace. It can help
        spot early signs of heart disease, stroke and type 2 diabetes, as well
        as kidney disease and dementia.
      </p>
      <h2>How it works</h2>
      <p>You&apos;ll need to give:</p>
      <ul>
        <li>
          a finger-prick blood test - we&apos;ll send you a free kit to do this
          at home
        </li>
        <li>
          a blood pressure reading - take this at a pharmacy or at home, if you
          have a monitor
        </li>
        <li>details about your lifestyle and family history</li>
        <li>
          your height, weight and waist measurement, it helps if you have a tape
          measure and bathroom scales for this
        </li>
      </ul>
      <p>The results will be sent to you and your GP surgery.</p>
      <h2>How long it takes</h2>
      <p>
        Most people find it takes 30 minutes or less. You do not need to do it
        all in one go, you can save your answers and come back.
      </p>
      <p>Once you start you need to complete it in 28 days.</p>
      <h2>If you do not feel comfortable doing the Health Check online</h2>
      <p>
        You can contact your GP surgery about doing the Health Check in person
        instead.
      </p>

      <Button onClick={() => startNow()}>Start now</Button>

      <p>
        <Link to={RoutePath.AboutThisSoftwarePage}>About this software</Link>
      </p>
    </PageLayout>
  );
}
