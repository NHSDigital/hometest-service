import { Helmet } from 'react-helmet';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePageTitleContext } from '../contexts/PageTitleContext';

interface DynamicPageTitleProps {
  routePageTitleHeadingMap: Record<string, string>;
  defaultPageTitle: string;
  isPageInError: boolean;
}

export function getPageTitle(pageHeading: string) {
  return `${pageHeading} - NHS Health Check online - NHS`;
}

export function DynamicPageTitle({
  routePageTitleHeadingMap,
  defaultPageTitle
}: DynamicPageTitleProps) {
  const location = useLocation();
  const { isPageInError, currentStep, setIsPageInError } =
    usePageTitleContext();

  const pageHeading =
    routePageTitleHeadingMap[currentStep ?? location.pathname];
  const pageTitle = pageHeading ? getPageTitle(pageHeading) : defaultPageTitle;

  useEffect(() => {
    setIsPageInError(false);
  }, [location, setIsPageInError]);

  return (
    <Helmet>
      <title>
        {isPageInError ? 'Error: ' : ''}
        {pageTitle}
      </title>
    </Helmet>
  );
}
