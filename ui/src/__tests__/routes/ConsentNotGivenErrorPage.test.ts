import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConsentNotGivenErrorPage from '../../routes/ConsentNotGivenErrorPage';

describe('ConsentNotGivenErrorPage tests', () => {
  test('renders the correct text content', () => {
    render(ConsentNotGivenErrorPage());
    //Assert
    expect(screen.getByText('Contact your GP surgery')).toBeInTheDocument();
    expect(
      screen.getByText(
        'To complete an NHS Health Check online, we need to confirm who you are. To do this, you need to agree to let NHS login share your information with us.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'If you do not agree to share your NHS login information, contact your GP surgery. They will explain how you can get your NHS Health Check.'
      )
    ).toBeInTheDocument();
  });
});
