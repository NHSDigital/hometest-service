import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import OdsNhsNumberNotEligiblePage from '../../routes/OdsNhsNumberNotEligiblePage';

describe('OdsNhsNumberNotEligiblePage tests', () => {
  test('renders the correct text content', () => {
    render(OdsNhsNumberNotEligiblePage());
    //Assert
    expect(screen.getByText('Contact your GP surgery')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The NHS Health Check online is a new service. Right now it is in a test phase.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This service is available by invitation only to a small group of patients from participating GP surgeries.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Useful resources')).toBeInTheDocument();
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
      screen.getByRole('link', { name: /BMI Healthy weight calculator/i })
    ).toHaveAttribute(
      'href',
      'https://www.nhs.uk/health-assessment-tools/calculate-your-body-mass-index/'
    );
    expect(
      screen.getByRole('link', { name: /Calculate your heart age/i })
    ).toHaveAttribute(
      'href',
      'https://www.nhs.uk/health-assessment-tools/calculate-your-heart-age'
    );
    expect(
      screen.getByRole('link', { name: /Healthy lifestyle support/i })
    ).toHaveAttribute('href', 'https://www.nhs.uk/live-well/');
  });
});
