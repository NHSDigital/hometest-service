process.env.REACT_APP_NHS_LOGIN_BASE_URL = 'http://mock-nhs-login.com';
process.env.REACT_APP_NHS_LOGIN_CLIENT_ID = 'mock-client-id';
process.env.REACT_APP_NHS_LOGIN_REDIRECT_URL = 'http://mock-digital-health-checks.com';
process.env.REACT_APP_HTC_BACKEND_API_ENDPOINT = 'test.com';
process.env.REACT_APP_EVENT_AUDIT_MAX_RETRIES = '2';
process.env.REACT_APP_ADDRESS_TEXT_INPUT_MAX_LENGTH = '20'

jest.mock('../src/lib/contexts/PageTitleContext', () => {
    const originalModule = jest.requireActual(
      '../src/lib/contexts/PageTitleContext'
    );
    return {
      ...originalModule,
      usePageTitleContext: jest.fn()
    };
  });
