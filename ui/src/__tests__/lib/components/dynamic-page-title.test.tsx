/* eslint-disable jest/expect-expect */

import { DynamicPageTitle } from '../../../lib/components/dynamic-page-title';
import { JourneyStepNames, RoutePath } from '../../../lib/models/route-paths';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import { render, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn()
}));
const mockedUseLocation = useLocation as jest.Mock;

const mockPageTitlesMap: Record<string, string> = {
  [RoutePath.TaskListPage]: 'NHS Health Check task list',
  [JourneyStepNames.PreexistingHealthConditionsPage]:
    'Pre-existing health conditions',
  [JourneyStepNames.PreviousHealthCheckCompletedQueryPage]:
    'Have you completed an NHS Health Check in the last 5 years?'
};
const DEFAULT_PAGE_TITLE = 'NHS Health Check online - NHS';

describe('DynamicPageTitle tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders title for a page available through a known path', async () => {
    mockedUseLocation.mockReturnValue({
      pathname: RoutePath.TaskListPage
    });
    setupPageTitlesMock(undefined, false);

    renderPageTitle();

    await verifyPageTitle(
      'NHS Health Check task list - NHS Health Check online - NHS'
    );
  });

  it('renders default title for a page available through a path that was not associated with title', async () => {
    mockedUseLocation.mockReturnValue({
      pathname: '/unknown-path'
    });
    setupPageTitlesMock(undefined, false);

    renderPageTitle();

    await verifyPageTitle(DEFAULT_PAGE_TITLE);
  });

  it('renders title for a page available as a step in the section journey', async () => {
    setupPageTitlesMock(
      JourneyStepNames.PreexistingHealthConditionsPage,
      false
    );

    renderPageTitle();

    await verifyPageTitle(
      'Pre-existing health conditions - NHS Health Check online - NHS'
    );
  });

  it('renders title with error when page has some error present in the error summary', async () => {
    setupPageTitlesMock(JourneyStepNames.PreexistingHealthConditionsPage, true);

    renderPageTitle();

    await verifyPageTitle(
      'Error: Pre-existing health conditions - NHS Health Check online - NHS'
    );
  });
});

function renderPageTitle() {
  render(
    <DynamicPageTitle
      routePageTitleHeadingMap={mockPageTitlesMap}
      defaultPageTitle={DEFAULT_PAGE_TITLE}
      isPageInError={false}
    />
  );
}

async function verifyPageTitle(expectedTitle: string) {
  await waitFor(() => expect(document.title).toEqual(expectedTitle));
}

function setupPageTitlesMock(
  currentStep: string | undefined,
  isPageInError: boolean
) {
  const setIsPageInErrorMock: jest.Mock = jest.fn();
  (usePageTitleContext as jest.Mock).mockReturnValue({
    isPageInError,
    setIsPageInError: setIsPageInErrorMock,
    currentStep
  });
  return setIsPageInErrorMock;
}
