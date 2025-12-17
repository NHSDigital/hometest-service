import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ExtendedExclusionsShutterPage from '../../../../routes/eligibility-journey/steps/ExtendedExclusionsShutterPage';
import type { IHealthCheck } from '@dnhc-health-checks/shared';

describe('ExtendedExclusionsShutterPage tests', () => {
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = '456';
  it('renders the component with initial state', () => {
    render(
      <BrowserRouter>
        <ExtendedExclusionsShutterPage
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );

    const texts = [
      'Book a face-to-face appointment with your GP surgery',
      'Ask your GP surgery about completing your NHS Health Check in a face-to-face appointment.',
      'This is so a clinician can make sure you get the right advice and guidance for your condition.',
      'In the meantime, here is more information from the NHS to help support your health and wellbeing.',
      'The following links open in a new tab'
    ];

    texts.forEach((text) => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });

    const links = [
      {
        name: /Find out more about NHS Health Checks/i,
        href: 'https://www.nhs.uk/conditions/nhs-health-check/'
      },
      {
        name: /Check your symptoms on NHS 111 online/i,
        href: 'https://111.nhs.uk/'
      },
      {
        name: /Calculate your heart age/i,
        href: 'https://www.nhs.uk/health-assessment-tools/calculate-your-heart-age'
      },
      {
        name: /Healthy lifestyle support/i,
        href: 'https://www.nhs.uk/live-well/'
      }
    ];

    links.forEach((link) => {
      expect(screen.getByRole('link', { name: link.name })).toHaveAttribute(
        'href',
        link.href
      );
    });
  });
});
