import { Button } from 'nhsuk-react-components';
import PageLayout from '../layouts/PageLayout';
import { NhsAppService } from '../lib/nhs-app/NhsAppService';
import { NhcQueryParams } from '../lib/routes/nhc-query-params';

export default function HomePage() {
  const nhsAppService = new NhsAppService();

  function loginViaNhsNhsApp() {
    const { urlSource } = new NhcQueryParams(window.location.search);

    const params = {
      ...(urlSource && { urlSource })
    };

    window.location.href = nhsAppService.createNhsAppRedirectorUri({
      urlSource: params.urlSource
    });
  }
  return (
    <PageLayout>
      <h1 className="nhsuk-heading-xl">Get your NHS Health Check online</h1>
      <p>
        The NHS Health Check is a free check-up of your health. It can help spot
        early signs of conditions like heart disease, stroke and type 2
        diabetes.
      </p>
      <p>
        Doing your NHS Health Check online means you do not have to make a GP
        appointment. The results are sent to your GP.
      </p>
      <h2>Before you start</h2>
      <p>
        We will ask you for some measurements. If you have the following items
        at home, have them nearby before you start:
      </p>
      <ul>
        <li>tape measure</li>
        <li>bathroom scales</li>
        <li>blood pressure monitor</li>
      </ul>
      <p>You can still complete your NHS Health Check without these items.</p>
      <div className="app-button-group">
        <Button
          className="app-button--login"
          onClick={() => loginViaNhsNhsApp()}
        >
          Log in or open NHS App
        </Button>
        <Button secondary={true} onClick={() => loginViaNhsNhsApp()}>
          Create an account
        </Button>
      </div>
    </PageLayout>
  );
}
