import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ProblemFindingAddressPage from '../../../../routes/blood-test-journey/steps/ProblemFindingAddressPage';

describe('ProblemFindingAddressPage tests', () => {
  it('renders the component with initial state', () => {
    render(
      <BrowserRouter>
        <ProblemFindingAddressPage />
      </BrowserRouter>
    );

    // Assert
    expect(
      screen.getByText(
        'Sorry, there was a problem finding your delivery address'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'There was a problem with the service. You can enter your address manually instead.'
      )
    ).toBeInTheDocument();
  });
});
