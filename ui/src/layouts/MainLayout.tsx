import {
  Link,
  Outlet,
  ScrollRestoration,
  useNavigate,
  useLocation
} from 'react-router-dom';
import { Header, Footer, Container, Button } from 'nhsuk-react-components';
import '../scss/MainLayout.scss';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionTimer } from '../lib/components/session-timer/session-timer';
import {
  RoutePath,
  isSessionHandlingRequiredForPage,
  isLogoutButtonRequiredForPage,
  pageTitlesMap
} from '../lib/models/route-paths';
import { PageTitleProvider } from '../lib/contexts/PageTitleContext';
import { DynamicPageTitle } from '../lib/components/dynamic-page-title';
import { nhtVersion } from '../settings';
import type React from 'react';

interface MainLayoutProps {
  readonly children?: React.ReactNode;
}

const queryClient = new QueryClient();

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const locationPath = location.pathname;
  const shouldLogoutButtonBeShown = isLogoutButtonRequiredForPage(locationPath);
  const renderSessionTimerForLoggedInUsers =
    isSessionHandlingRequiredForPage(locationPath);
  const navigate = useNavigate();

  const isUserComingFromNHSApp: boolean = window.nhsapp.tools.isOpenInNHSApp();
  const logOutInBrowser = () => navigate(RoutePath.LogoutPage);
  const externalPoliciesLandingPageUrl =
    'https://www.nhs.uk/nhs-services/online-services/get-your-nhs-health-check-online';

  return (
    <>
      {
        // Visually hidden separator for screen readers.
        // Used with `aria-labelledby` to add a pause between two combined text fragments.
        // Defined globally to avoid code duplication and ensure consistent accessibility behavior across the app.
        <span
          id="screen-reader-text-separator"
          aria-hidden="true"
          className="nhsuk-u-visually-hidden"
        >
          :
        </span>
      }
      <PageTitleProvider>
        <DynamicPageTitle
          routePageTitleHeadingMap={pageTitlesMap}
          defaultPageTitle="NHS Health Check online - NHS"
          isPageInError={false}
        />
        <ScrollRestoration />
        {!isUserComingFromNHSApp && (
          <Header transactional>
            <Header.Container>
              <Header.Logo
                to={
                  shouldLogoutButtonBeShown
                    ? 'https://www.nhsapp.service.nhs.uk/patient/'
                    : 'https://www.nhs.uk/'
                }
                asElement={Link}
              />
              <Header.ServiceName
                href={RoutePath.HomePage}
                className="header-service-name"
              >
                NHS Home Testing Service
              </Header.ServiceName>
              <Header.Content className="logout-container">
                {shouldLogoutButtonBeShown && (
                  <Button
                    className="nhsuk-u-margin-bottom-0"
                    onClick={logOutInBrowser}
                  >
                    Log out
                  </Button>
                )}
              </Header.Content>
            </Header.Container>
          </Header>
        )}
        <Container>
          <QueryClientProvider client={queryClient}>
            {renderSessionTimerForLoggedInUsers ? <SessionTimer /> : null}
            {children ?? <Outlet />}
          </QueryClientProvider>
        </Container>
        <Footer>
          <Footer.List>
            {[
              { text: 'Terms of use', href: 'legal-and-cookies/terms-of-use' },
              {
                text: 'Privacy policy',
                href: 'legal-and-cookies/privacy-policy'
              },
              { text: 'Help and support', href: 'help-and-support' },
              {
                text: 'Accessibility statement',
                href: 'legal-and-cookies/accessibility-statement'
              }
            ].map((link) => (
              <Footer.ListItem
                key={link.href}
                href={`${externalPoliciesLandingPageUrl}/${link.href}`}
              >
                {link.text}
              </Footer.ListItem>
            ))}
          </Footer.List>
          <Footer.Copyright>
            &copy; Crown copyright{' '}
            <Footer.Copyright>{nhtVersion}</Footer.Copyright>
          </Footer.Copyright>
        </Footer>
      </PageTitleProvider>
    </>
  );
}
