import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LowBloodPressureShutterPage from '../../../../routes/blood-pressure-journey/steps/low-blood-pressure/LowBloodPressureShutterPage';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useHealthCheck } from '../../../../hooks/healthCheckHooks';
import {
  BloodPressureCategory,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';

jest.mock('../../../../hooks/healthCheckHooks');
const mockTriggerAuditEvent = jest.fn();
jest.mock('../../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));
describe('LowBloodPressureShutterPage tests', () => {
  const healthCheckData: IHealthCheck = {
    id: '12345',
    questionnaire: {
      bloodPressureDiastolic: 60,
      bloodPressureLocation: 'With a monitor at home',
      bloodPressureSystolic: 80
    },
    questionnaireScores: {
      bloodPressureCategory: BloodPressureCategory.Low
    },
    patientId: 'abcd12345',
    dataModelVersion: '1.2.3'
  } as any;

  const server = setupServer(
    http.get('test.com/health-checks', () =>
      HttpResponse.json({
        healthChecks: [healthCheckData]
      })
    )
  );

  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    (useHealthCheck as jest.Mock).mockReturnValue({
      data: healthCheckData,
      isSuccess: true,
      isPending: false,
      isError: false
    });
  });
  afterAll(() => server.close());

  afterEach(() => {
    jest.resetAllMocks();
    server.resetHandlers();
  });

  it('renders the component with initial state', () => {
    render(
      <LowBloodPressureShutterPage
        healthCheck={healthCheckData}
        patientId={healthCheckData.patientId}
      />
    );

    expect(
      screen.getByText(`You cannot complete your NHS Health Check online`)
    ).toBeInTheDocument();
  });

  it('displays the low blood pressure message', () => {
    render(
      <LowBloodPressureShutterPage
        healthCheck={healthCheckData}
        patientId={healthCheckData.patientId}
      />
    );
    expect(
      screen.getByText(/Your blood pressure is 80\/60. This is low./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/You also have symptoms of fainting and dizziness./i)
    ).toBeInTheDocument();
  });

  it('renders the details component for understanding blood pressure', () => {
    render(
      <LowBloodPressureShutterPage
        healthCheck={healthCheckData}
        patientId={healthCheckData.patientId}
      />
    );
    const detailsSummary = screen.getByText(
      /Understanding your blood pressure reading/i
    );
    expect(detailsSummary).toBeInTheDocument();
    fireEvent.click(detailsSummary);
    expect(
      screen.getByText(/Low blood pressure ranges from 70\/40 to 89\/59/i)
    ).toBeVisible();
  });

  it('renders the emergency advice section', () => {
    render(
      <LowBloodPressureShutterPage
        healthCheck={healthCheckData}
        patientId={healthCheckData.patientId}
      />
    );
    const cardElement = screen.getByRole('heading', { level: 2 });
    expect(cardElement).toHaveClass('nhsuk-card--care__heading');
    expect(cardElement).toHaveTextContent('Call');
    expect(
      screen.getByText(/you have symptoms of fainting and dizziness/i)
    ).toBeInTheDocument();
  });

  it('renders the 111 call link and website link', () => {
    render(
      <LowBloodPressureShutterPage
        healthCheck={healthCheckData}
        patientId={healthCheckData.patientId}
      />
    );
    const phoneAnchorElement = screen.getByText('Call 111');
    expect(phoneAnchorElement).toBeInTheDocument();
    expect(phoneAnchorElement).toHaveAttribute('href', 'tel:111');

    const websiteLink = screen.getByRole('link', { name: /111 website/i });
    expect(websiteLink).toHaveAttribute('href', 'https://111.nhs.uk/');
  });

  it('renders the NHS guidance link', () => {
    render(
      <LowBloodPressureShutterPage
        healthCheck={healthCheckData}
        patientId={healthCheckData.patientId}
      />
    );

    const nhsGuidanceLink = screen.getByRole('link', {
      name: /Read NHS guidance on low blood pressure/i
    });
    expect(nhsGuidanceLink).toHaveAttribute(
      'href',
      'https://www.nhs.uk/conditions/low-blood-pressure-hypotension/'
    );
  });

  it('Should call EventAuditClient on render', () => {
    render(
      <LowBloodPressureShutterPage
        healthCheck={healthCheckData}
        patientId={healthCheckData.patientId}
      />
    );

    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.UrgentLowBloodPressure,
      healthCheck: healthCheckData,
      patientId: healthCheckData.patientId
    });
  });
});
