import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import DiabetesShutterPage from '../../../../routes/body-measurements-journey/steps/DiabetesShutterPage';

const mockTriggerAuditEvent = jest.fn();
jest.mock('../../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));
describe('DiabetesShutterPage tests', () => {
  beforeEach(() => {
    mockTriggerAuditEvent.mockReset();
  });

  it('renders the component with initial state', () => {
    render(
      <BrowserRouter>
        <DiabetesShutterPage />
      </BrowserRouter>
    );

    // Assert
    expect(
      screen.getByText('Book a face-to-face appointment with your GP surgery')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your answers indicate that you might be at risk of type 2 diabetes. This is a common health condition.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'The earlier diabetes is diagnosed and treatment started, the better. Early treatment reduces your risk of other health problems.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Having some diabetes symptoms doesn’t mean you definitely have the condition. Your GP can help you get the right diagnosis and treatment.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Contact your GP')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Make an appointment with your GP to discuss your symptoms.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "You'll need a blood test to check your blood sugar (glucose)."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This helps to diagnose type 2 diabetes and identify prediabetes.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Find out more')).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name: /Read NHS guidance on type 2 diabetes/i
      })
    ).toHaveAttribute('href', 'https://www.nhs.uk/conditions/type-2-diabetes/');
  });
});
