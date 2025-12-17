import { render, screen } from '@testing-library/react';
import NhsLoginErrorPage from '../../routes/NhsLoginErrorPage';
import { BrowserRouter } from 'react-router-dom';

describe('NhsLoginErrorPage tests', () => {
  test('renders content successfully', () => {
    render(
      <BrowserRouter>
        <NhsLoginErrorPage />
      </BrowserRouter>
    );
    expect(
      screen.getByText('Sorry, there is a problem with this service')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'There was an issue with NHS login. This may be temporary.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Try again later.')).toBeInTheDocument();
  });
});
