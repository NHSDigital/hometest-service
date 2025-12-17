import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import EverydayMovementPage from '../../../../routes/physical-activity-journey/steps/EverydayMovementPage';

const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate
}));

describe('EverydayMovement', () => {
  const nextStepUrl = 'the-next-step';

  it('renders expected page contents', () => {
    render(<EverydayMovementPage nextStepUrl={nextStepUrl} />);

    // heading
    expect(screen.getByText('Everyday movement')).toBeInTheDocument();

    // text
    expect(
      screen.getByText(
        'We have 2 more questions about your daily activities, including:'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'These questions are optional. Your answers will help us give you the best advice for your lifestyle.'
      )
    ).toBeInTheDocument();
  });

  test('should navigate to the returned next step when button is clicked', () => {
    render(
      <MemoryRouter>
        <EverydayMovementPage nextStepUrl={nextStepUrl} />
      </MemoryRouter>
    );

    const continueButton: HTMLElement = screen.getByText('Continue');
    fireEvent.click(continueButton);

    expect(mockedUseNavigate).toHaveBeenCalledWith(nextStepUrl);
  });
});
