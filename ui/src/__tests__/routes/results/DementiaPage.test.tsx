import { render, screen } from '@testing-library/react';
import { Router } from 'react-router';
import { createMemoryHistory } from 'history';
import {
  AuditEventType,
  type IHealthCheck,
  PatientResultsDetailedOpenedPage
} from '@dnhc-health-checks/shared';
import DementiaPage from '../../../routes/results/DementiaPage';
import { useHealthCheck } from '../../../hooks/healthCheckHooks';

const mockTriggerAuditEvent = jest.fn();
const healthCheck: IHealthCheck = {
  id: '12345',
  dataModelVersion: '1.2.3'
} as unknown as IHealthCheck;

jest.mock('../../../hooks/healthCheckHooks');
jest.mock('../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));

afterEach(() => {
  mockTriggerAuditEvent.mockReset();
});

beforeEach(() => {
  (useHealthCheck as jest.Mock).mockReturnValue({
    data: healthCheck,
    isSuccess: true,
    isPending: false,
    isError: false
  });
});
describe('DementiaPage tests', () => {
  const renderComponent = () => {
    const history = createMemoryHistory();
    return render(
      <Router location={history.location} navigator={history}>
        <DementiaPage />
      </Router>
    );
  };

  describe('rendering', () => {
    it('renders main headings and sections', () => {
      renderComponent();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Dementia'
      );
      expect(
        screen.getByRole('heading', { level: 2, name: /healthy heart/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Dementia is caused by diseases of the brain. This leads to issues with memory, thinking and behaviour.'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'The heart helps to protect the brain by pumping oxygen and nutrients carried in the blood to the brain.'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Keeping your heart healthy supports your brain, and can lower your risk of dementia.'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Dementia is not an inevitable part of ageing/)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 2, name: /reduce your risk/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          level: 3,
          name: /Manage existing health conditions/i
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          level: 3,
          name: /Make healthy lifestyle choices/i
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 2, name: /Useful guidance/i })
      ).toBeInTheDocument();
    });

    it('renders all symptom list items', () => {
      renderComponent();
      expect(screen.getByText('forgetting things')).toBeInTheDocument();
      expect(
        screen.getByText('trouble focusing or doing familiar tasks')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'struggling to follow a conversation or find the right words'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'getting confused about where you are or what time it is'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText('changes in your mood and personality')
      ).toBeInTheDocument();
    });

    it('renders all risk condition list items', () => {
      renderComponent();
      expect(screen.getByText('depression')).toBeInTheDocument();
      expect(screen.getByText('diabetes')).toBeInTheDocument();
      expect(screen.getByText('high blood pressure')).toBeInTheDocument();
      expect(screen.getByText('high cholesterol')).toBeInTheDocument();
      expect(
        screen.getByText('untreated vision or hearing loss or impairment')
      ).toBeInTheDocument();
    });

    it('renders all Do list items', () => {
      renderComponent();
      expect(
        screen.getByText(
          'be active every day - exercise helps blood flow to your brain'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'stay socially and mentally active - it keeps your brain strong'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'eat a balanced diet - include vegetables, fruits and lean proteins like chicken, fish and beans'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'eat less processed meat, fried food, sugary sweets and drinks'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'keep a healthy weight - too much weight strains the heart'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'drink less alcohol - too much harms your heart and brain'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText('stop smoking - it reduces oxygen to your brain')
      ).toBeInTheDocument();
    });

    it('renders all external guidance links', () => {
      renderComponent();
      expect(
        screen.getByText('Read NHS guidance on dementia')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Get help and support from Dementia UK')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Find support near you on the Alzheimer’s Society website'
        )
      ).toBeInTheDocument();
    });
  });

  describe('audit event', () => {
    it(`send '${AuditEventType.PatientResultsDetailedOpened}' event when page is rendered`, () => {
      renderComponent();
      expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.PatientResultsDetailedOpened,
        details: { page: PatientResultsDetailedOpenedPage.Dementia },
        healthCheck
      });
    });
  });
});
