import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SorryCannotGetHealthCheckWithPreexistingConditionPage from '../../../../routes/eligibility-journey/steps/SorryCannotGetHealthCheckWithPreexistingConditionPage';
import { type IHealthCheck } from '@dnhc-health-checks/shared';

describe('SorryCannotGetHealthCheckWithPreexistingConditionPage tests', () => {
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = '456';
  it('renders the component with initial state', () => {
    render(
      SorryCannotGetHealthCheckWithPreexistingConditionPage({
        healthCheck,
        patientId
      })
    );
    // Assert
    expect(
      screen.getByText('Sorry, you cannot get an NHS Health Check right now')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'If you have a pre-existing condition you cannot have the NHS Health Check.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'You should have regular check-ups about your condition. Your care team will be able to give you more information about this.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Here is more information from the NHS to help support your health and wellbeing.'
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText('The following links open in a new tab.')
    ).toBeInTheDocument();

    // Check links
    expect(
      screen.getByRole('link', {
        name: /Find out more about NHS Health Checks/i
      })
    ).toHaveAttribute('href', 'https://www.nhs.uk/conditions/nhs-health-check');
    expect(
      screen.getByRole('link', {
        name: /Check your symptoms on NHS 111 online/i
      })
    ).toHaveAttribute('href', 'https://111.nhs.uk/');
    expect(
      screen.getByRole('link', { name: /BMI Healthy weight calculator/i })
    ).toHaveAttribute(
      'href',
      'https://www.nhs.uk/health-assessment-tools/calculate-your-body-mass-index'
    );
    expect(
      screen.getByRole('link', { name: /Calculate your heart age/i })
    ).toHaveAttribute(
      'href',
      'https://www.nhs.uk/health-assessment-tools/calculate-your-heart-age'
    );
    expect(
      screen.getByRole('link', { name: /Healthy lifestyle support/i })
    ).toHaveAttribute('href', 'https://www.nhs.uk/live-well');
  });
});
