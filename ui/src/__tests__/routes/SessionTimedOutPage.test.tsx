import { fireEvent, render, screen } from '@testing-library/react';
import { NhsLoginService } from '../../lib/nhs-login/NhsLoginService';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SessionTimedOutPage from '../../routes/SessionTimedOutPage';

jest.mock('../../lib/nhs-login/NhsLoginService');
const loginUrl = 'https://testurl.com';
describe('HomePage', () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;

    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: '' }
    });

    const mockCreateAuthorizeUri = jest.fn().mockImplementation(() => {
      return loginUrl;
    });
    const mockNhsLoginService = {
      createAuthorizeUri: mockCreateAuthorizeUri
    };
    (NhsLoginService as jest.Mock).mockReturnValue(mockNhsLoginService);
  });
  afterEach(() => {
    window.location = originalLocation;
  });

  test('renders the correct content', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <SessionTimedOutPage />
      </QueryClientProvider>
    );

    expect(
      screen.getByText('For security, we’ve logged you out')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Continue/i })
    ).toBeInTheDocument();
  });

  test('calls loginViaNhsLogin on button click', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <SessionTimedOutPage />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    expect(window.location.href).toBe(loginUrl);
  });
});
