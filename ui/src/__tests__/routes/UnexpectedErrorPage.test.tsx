import { render, screen } from '@testing-library/react';
import UnexpectedErrorPage from '../../routes/UnexpectedErrorPage';
import { BrowserRouter } from 'react-router-dom';

describe('UnexpectedErrorPage tests', () => {
  test('renders content successfully', () => {
    render(
      <BrowserRouter>
        <UnexpectedErrorPage />
      </BrowserRouter>
    );
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Sorry, there is a problem with this service/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'There is a problem with the NHS Health Check online service right now.'
      )
    ).toBeInTheDocument();
  });
});
