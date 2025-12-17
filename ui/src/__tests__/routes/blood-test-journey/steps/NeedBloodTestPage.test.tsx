import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import NeedBloodTestPage from '../../../../routes/blood-test-journey/steps/NeedBloodTestPage';
import type { IHealthCheck } from '@dnhc-health-checks/shared';

describe('NeedBloodTestPage tests', () => {
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = '456';
  it('renders the component with initial state', () => {
    render(
      <BrowserRouter>
        <NeedBloodTestPage healthCheck={healthCheck} patientId={patientId} />
      </BrowserRouter>
    );

    // Assert
    expect(
      screen.getByText('Book a face-to-face appointment with your GP surgery')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'To complete your NHS Health Check online, we need a blood sample. This helps us to spot early signs of conditions like heart disease, stroke and type 2 diabetes.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'If you do not want to take a blood test, or cannot take a sample yourself, you should contact your GP surgery.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your GP surgery will explain how you can complete your NHS Health Check.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'In the meantime, here is more information from the NHS to help support your health and wellbeing.'
      )
    ).toBeInTheDocument();

    // Check links
    expect(
      screen.getByRole('link', {
        name: /Find out more about NHS Health Checks/i
      })
    ).toHaveAttribute(
      'href',
      'https://www.nhs.uk/conditions/nhs-health-check/'
    );
    expect(
      screen.getByRole('link', {
        name: /Check your symptoms on NHS 111 online/i
      })
    ).toHaveAttribute('href', 'https://111.nhs.uk/');
    expect(
      screen.getByRole('link', {
        name: /BMI Healthy weight calculator/i
      })
    ).toHaveAttribute(
      'href',
      'https://www.nhs.uk/health-assessment-tools/calculate-your-body-mass-index/'
    );
    expect(
      screen.getByRole('link', {
        name: /Calculate your heart age/i
      })
    ).toHaveAttribute(
      'href',
      'https://www.nhs.uk/health-assessment-tools/calculate-your-heart-age'
    );
    expect(
      screen.getByRole('link', {
        name: /Healthy lifestyle support/i
      })
    ).toHaveAttribute('href', 'https://www.nhs.uk/live-well/');
    expect(
      screen.getByRole('link', {
        name: /How Are You\? \(Free personalised health score\)/i
      })
    ).toHaveAttribute(
      'href',
      'https://www.nhs.uk/better-health/how-are-you-quiz/'
    );
  });
});
