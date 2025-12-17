import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotEligiblePage from '../../routes/NotEligiblePage';

describe('NotEligiblePage tests', () => {
  test('renders the correct text content', () => {
    render(NotEligiblePage());
    //Assert
    expect(
      screen.getByText('Sorry, you cannot get an NHS Health Check')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'The NHS Health Check is for people who are aged 40 to 74'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'According to your NHS health record, you are not in this age range.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'If you have concerns about your health or symptoms, speak to your GP.'
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
