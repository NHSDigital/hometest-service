import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LogoutPage from '../../routes/LogoutPage';
import { httpClient } from '../../lib/http/http-client';
import { NhsLoginService } from '../../lib/nhs-login/NhsLoginService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../lib/http/http-client');
jest.mock('../../lib/nhs-login/NhsLoginService');

const mockedUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate
}));

const loginURL = 'https://testurl.com';
const mockCreateAuthorizeUri = jest.fn().mockReturnValue(loginURL);
const mockNhsLoginService = {
  createAuthorizeUri: mockCreateAuthorizeUri
};

describe('LogoutPage', () => {
  it('logs out and navigates to the nhs login page via NhsLoginService', async () => {
    const mockPostRequest = httpClient.postRequest as jest.Mock;
    mockPostRequest.mockResolvedValue({});
    (NhsLoginService as jest.Mock).mockReturnValue(mockNhsLoginService);

    Object.defineProperty(window, 'location', {
      value: {
        search: '',
        href: ''
      },
      writable: true
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <LogoutPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Continue/i })
      ).toBeInTheDocument();
    });

    expect(mockPostRequest).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    expect(mockCreateAuthorizeUri).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe(loginURL);
  });
});
