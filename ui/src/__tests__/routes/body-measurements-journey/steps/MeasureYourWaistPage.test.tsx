import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import MeasureYourWaistPage from '../../../../routes/body-measurements-journey/steps/MeasureYourWaistPage';
import userEvent from '@testing-library/user-event';

const mockTriggerAuditEvent = jest.fn();
jest.mock('../../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));
describe('MeasureYourWaistPage tests', () => {
  const mockOnContinue = jest.fn();

  beforeEach(() => {
    mockTriggerAuditEvent.mockReset();
  });

  it('renders the component with initial state', () => {
    render(
      <BrowserRouter>
        <MeasureYourWaistPage onContinue={mockOnContinue} />
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByText('Measure your waist')).toBeInTheDocument();
    expect(
      screen.getByText(
        'We need your waist measurement to help calculate your risk of type 2 diabetes.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('How to measure your waist')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Many of us underestimate our waist size. An accurate measurement is important. Use a soft tape measure for the best result.'
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name: /Watch an NHS video of how to measure your waist/i
      })
    ).toHaveAttribute('href', 'https://www.youtube.com/watch?v=dwk8sVCKuio');
  });

  it('should call onContinue method on continue button click', async () => {
    // arrange
    render(
      <BrowserRouter>
        <MeasureYourWaistPage onContinue={mockOnContinue} />
      </BrowserRouter>
    );
    const element = screen.getByText('Continue');

    // act
    await userEvent.click(element);

    // assert
    expect(mockOnContinue).toHaveBeenCalled();
  });
});
