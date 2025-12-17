import { render, screen } from '@testing-library/react';
import GlobalErrorPage from '../../routes/GlobalErrorPage';

// eslint-disable-next-line react/display-name
jest.mock('../../layouts/PageLayout', () => ({ children }: any) => (
  <div>{children}</div>
));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useRouteError: () => ({ message: 'Test error' })
}));

describe('GlobalErrorPage', () => {
  it('renders error message', () => {
    render(<GlobalErrorPage />);
    expect(screen.getByText('Oops!')).toBeInTheDocument();
    expect(
      screen.getByText('Sorry, an unexpected error has occurred.')
    ).toBeInTheDocument();
  });
  it('logs the error to console', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    render(<GlobalErrorPage />);
    expect(consoleErrorSpy).toHaveBeenCalledWith({ message: 'Test error' });
    consoleErrorSpy.mockRestore();
  });
});
