import { type AxeResults, type Result } from 'axe-core';
import AxeBuilder from '@axe-core/playwright';
import { type Page } from '@playwright/test';
import { createHtmlReport } from 'axe-html-reporter';
import { existsSync, mkdirSync } from 'fs';

export const tagList: string[] = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa'
];

export async function runAccessibilityTest(
  page: Page,
  pageName: string,
  prefix: string = ''
): Promise<Result[]> {
  const scanResult: AxeResults = await new AxeBuilder({ page })
    .withTags(tagList)
    .analyze();
    
  return await createHtmlAccessibilityReport(scanResult, pageName, prefix);
}

export async function createHtmlAccessibilityReport(
  scanResult: AxeResults,
  pageName: string,
  prefix: string = '',
): Promise<Result[]> {
  const accessErrors: Result[] = [];
  

  const accessibilityReportPath = 'tests/testResults/accessibility';
  const accessibilityReportHtml =
    prefix === ''
      ? `${pageName}-accessibility-report.html`
      : `${prefix}-${pageName}-accessibility-report.html`;

  if (!existsSync(accessibilityReportPath)) {
    mkdirSync(accessibilityReportPath, {
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
