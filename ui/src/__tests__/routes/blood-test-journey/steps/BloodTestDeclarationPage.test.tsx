import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { BloodTestDeclarationPage } from '../../../../routes/blood-test-journey/steps/BloodTestDeclarationPage';
import { AuditEventType, type IHealthCheck } from '@dnhc-health-checks/shared';

const mockTriggerAuditEvent = jest.fn();
jest.mock('../../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));

describe('BloodTestDeclarationPage tests', () => {
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '2.3.4',
    questionnaireScores: {
      leicesterRiskScore: 10
    },
    questionnaireCompletionDate: '2023-10-01T00:00:00Z'
  } as IHealthCheck;
  const healthCheckRequiringSingleTest: IHealthCheck = {
    ...healthCheck,
    questionnaireScores: {
      leicesterRiskScore: 15
    },
    questionnaireCompletionDate: '2023-10-01T00:00:00Z'
  } as IHealthCheck;
  const healthCheckRequiringMultipleTests: IHealthCheck = {
    ...healthCheck,
    questionnaireScores: {
      leicesterRiskScore: 16
    },
    questionnaireCompletionDate: '2023-10-01T00:00:00Z'
  } as IHealthCheck;
  const patientId = 'abcd12345';
  const formattedExpiryDate = '30 December 2023';
  const mockOnContinue = jest.fn();

  afterEach(() => {
    mockOnContinue.mockReset();
    mockTriggerAuditEvent.mockReset();
  });

  it('should call onContinue method on continue button click', async () => {
    render(
      <BrowserRouter>
        <BloodTestDeclarationPage
          showSubmittedBanner={false}
          onContinue={mockOnContinue}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );
    const continueButton = screen.getByRole('button', {
      name: /Order a blood test kit/i
    });

    await userEvent.click(continueButton);

    expect(mockOnContinue).toHaveBeenCalled();
  });

  it('should render the content correctly when user requires single blood test kit', () => {
    render(
      <BrowserRouter>
        <BloodTestDeclarationPage
          showSubmittedBanner={false}
          onContinue={mockOnContinue}
          healthCheck={healthCheckRequiringSingleTest}
          patientId={patientId}
        />
      </BrowserRouter>
    );

    expect(
      screen.getByRole('heading', { name: /Order a blood test kit/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /To get your Health Check results, the final step is to complete a finger-prick blood test at home./i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /We’ll send you a free kit by post, with full instructions and support./i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Complete the test and post it back free of charge for analysis./i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `Post your test back as soon as you can. We need to have the analysis complete by ${formattedExpiryDate}, or your Health Check will expire.`
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name: /I do not want to do a blood test at home/i
      })
    ).toBeInTheDocument();
  });

  it('should render the content correctly when user requires two blood test kits', () => {
    render(
      <BrowserRouter>
        <BloodTestDeclarationPage
          showSubmittedBanner={false}
          onContinue={mockOnContinue}
          healthCheck={healthCheckRequiringMultipleTests}
          patientId={patientId}
        />
      </BrowserRouter>
    );

    expect(
      screen.getByRole('heading', { name: /Order a blood test kit/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /To get your Health Check results, the final step is to complete a finger-prick blood test at home./i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /We’ll send you a free kit by post, with full instructions and support./i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /There are two tests in the kit. Complete both and post them back free of charge for analysis./i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `Post your tests back as soon as you can. We need to have the analysis complete by ${formattedExpiryDate}, or your Health Check will expire.`
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name: /I do not want to do a blood test at home/i
      })
    ).toBeInTheDocument();
  });

  it('should send an event upon clicking I do not want to do a blood test at home link', async () => {
    // arrange
    render(
      <BrowserRouter>
        <BloodTestDeclarationPage
          showSubmittedBanner={false}
          onContinue={mockOnContinue}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );
    const element = screen.getByRole('link', {
      name: /I do not want to do a blood test at home/i
    });

    // act
    await userEvent.click(element);

    // assert
    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.BloodTestDeclined,
      healthCheck: expect.objectContaining({
        id: '12345',
        dataModelVersion: '2.3.4'
      }),
      patientId
    });
  });

  it('should display the submitted banner when showSubmittedBanner is true', () => {
    render(
      <BrowserRouter>
        <BloodTestDeclarationPage
          showSubmittedBanner={true}
          onContinue={mockOnContinue}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );

    expect(
      screen.getByText(
        "Answers submitted. There's one more thing you need to do."
      )
    ).toBeInTheDocument();
  });
});
