import React from 'react';
import SingleSignOnPage from '../../routes/SingleSignOnPage';
import { NhsLoginService } from '../../lib/nhs-login/NhsLoginService';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { RoutePath } from '../../lib/models/route-paths';
jest.mock('../../lib/nhs-login/NhsLoginService');

const singleSignOnUri = 'https://testurl.com';
const mockCreateAuthorizeUri = jest.fn().mockImplementation(() => {
  return singleSignOnUri;
});

const mockedUseNavigate = jest.fn();
const replaceSpy = jest.fn();

const mockNhsLoginService = {
  createAuthorizeUri: mockCreateAuthorizeUri
};
(NhsLoginService as jest.Mock).mockReturnValue(mockNhsLoginService);

afterEach(() => {
  mockCreateAuthorizeUri.mockClear();
  replaceSpy.mockClear();
  mockedUseNavigate.mockClear();
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate
}));

describe('SingleSignOnPage tests', () => {
  it.each([
    {
      description: 'only assertedLoginIdentity',
      assertedLoginIdentity: 'xyz',
      urlSource: undefined,
      expectedStateParams: {}
    },
    {
      description: 'assertedLoginIdentity and s parameter',
      assertedLoginIdentity: 'abc',
      urlSource: 'nudge',
      expectedStateParams: { urlSource: 'nudge' }
    }
  ])(
    'renders loading and redirects with $description',
    ({ assertedLoginIdentity, urlSource, expectedStateParams }) => {
      // arrange
      const urlParams = new URLSearchParams();
      urlParams.set('assertedLoginIdentity', assertedLoginIdentity);
      if (urlSource) urlParams.set('s', urlSource);
      Object.defineProperty(window, 'location', {
        value: {
          search: `?${urlParams.toString()}`,
          replace: replaceSpy
        },
        writable: true
      });

      // act
      render(<SingleSignOnPage />);

      // assert
      expect(screen.getByText('Spinner')).toBeInTheDocument();
      expect(mockCreateAuthorizeUri).toHaveBeenCalledWith({
        assertedLoginIdentity,
        stateParams: expectedStateParams
      });
      expect(replaceSpy).toHaveBeenCalledWith(singleSignOnUri);
    }
  );

  it.each([[''], ['IA']])(
    'redirects to logout when no assertedLoginIdentity provided',
    (urlSource: string) => {
      const urlParams = new URLSearchParams();
      if (urlSource) urlParams.set('s', urlSource);

      Object.defineProperty(window, 'location', {
        value: {
          search: `?${urlParams.toString()}`,
          replace: replaceSpy
        },
        writable: true
      });

      // act
      render(<SingleSignOnPage />);

      // assert
      expect(screen.getByText('Spinner')).toBeInTheDocument();
      expect(mockCreateAuthorizeUri).not.toHaveBeenCalled();
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        `${RoutePath.HomePage}?${urlParams}`,
        { replace: true }
      );
    }
  );
});
