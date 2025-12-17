import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BloodTestDataExpiredShutterPage from '../../routes/BloodTestDataExpiredShutterPage';

describe('BloodTestDataExpiredShutterPage', () => {
  it('renders the correct text content', () => {
    render(
      <BrowserRouter>
        <BloodTestDataExpiredShutterPage />
      </BrowserRouter>
    );
    //Assert
    expect(
      screen.getByText('Book a face-to-face appointment with your GP surgery')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'We did not receive the results of your blood test in time. This means the time to complete your NHS Health Check online has expired.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'If you have completed any sections of the health check online, these will be saved to your health record.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'For more information about how we process and protect your data, see the .'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: /Privacy Policy/i
      })
    ).toHaveAttribute(
      'href',
      'https://www.nhs.uk/nhs-services/online-services/get-your-nhs-health-check-online/legal-and-cookies/privacy-policy/'
    );
    expect(
      screen.getByText('Complete your NHS Health Check at your GP surgery')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Contact your GP surgery to make an appointment to complete your health check with a healthcare professional.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'In the meantime, here is more information from the NHS to help support your health and wellbeing.'
      )
    ).toBeInTheDocument();
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
  });
});
