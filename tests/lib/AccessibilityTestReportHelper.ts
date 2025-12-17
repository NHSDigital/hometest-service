import { type AxeResults, type Result } from 'axe-core';
import { type HTCPage } from '../page-objects/HTCPage';
import { type RadioConfirmationPage } from '../page-objects/RadioConfirmationPage';
import { verifyPageTitle } from './PageTitleHelper';
import { createHtmlReport } from 'axe-html-reporter';
import * as fs from 'fs';

export const tagList: string[] = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa'
];

export async function createHtmlAccessibilityReport(
  scanResult: AxeResults,
  pageName: string,
  prefix: string = '',
  page: HTCPage
): Promise<Result[]> {
  const accessErrors: Result[] = [];
  await verifyPageTitle(page);

  const accessibilityReportPath = 'testResults/accessibility';
  const accessibilityReportHtml =
    prefix === ''
      ? `${pageName}-accessibility-report.html`
      : `${prefix}-${pageName}-accessibility-report.html`;

  if (!fs.existsSync(`${accessibilityReportPath}/${accessibilityReportHtml}`)) {
    fs.mkdirSync(`${accessibilityReportPath}/`, {
      recursive: true
    });
  }

  createHtmlReport({
    results: scanResult,
    options: {
      projectKey: `${pageName}`,
      outputDir: accessibilityReportPath,
      reportFileName: accessibilityReportHtml
    }
  });

  scanResult.violations.forEach((element) => {
    accessErrors.push(element);
  });

  if (accessErrors.length > 0)
    console.log(
      `${accessErrors.length} accessibility errors found on ${pageName}`
    );

  return accessErrors;
}

// eslint-disable-next-line max-params
export async function goFromRadioConfirmationPage(
  lastPage: RadioConfirmationPage,
  currentPage: HTCPage,
  reportName: string,
  reportPrefix: string,
  scanResults: AxeResults,
  accessErrors: Result[]
): Promise<void> {
  await lastPage.clickNoRadioButton();
  await lastPage.clickContinueButton();
  await currentPage.waitUntilLoaded();

  accessErrors.push(
    ...(await createHtmlAccessibilityReport(
      scanResults,
      reportName,
      reportPrefix,
      currentPage
    ))
  );
}
