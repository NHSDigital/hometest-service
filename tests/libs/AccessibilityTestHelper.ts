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

  if (accessErrors.length > 0) {
    console.log(
      `\n❌ ${accessErrors.length} accessibility violation(s) found on ${pageName}:`
    );
    accessErrors.forEach((violation, index) => {
      console.log(`\n${index + 1}. ${violation.id}: ${violation.description}`);
      console.log(`   Impact: ${violation.impact}`);
      console.log(`   Help: ${violation.help}`);
      console.log(`   Affected nodes: ${violation.nodes.length}`);
      violation.nodes.forEach((node, nodeIndex) => {
        console.log(`   ${nodeIndex + 1}) ${node.html}`);
      });
    });
    console.log(`\n📄 Full report: ${accessibilityReportPath}/${accessibilityReportHtml}\n`);
  }

  return accessErrors;
}
