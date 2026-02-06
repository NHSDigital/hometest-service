import { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHtmlReport } from 'axe-html-reporter';
import { AxeResults, Result } from 'axe-core';
import { existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import { config } from '../configuration';
import { EnvironmentVariables } from '../configuration';

// Accessibility standards to test against
const ACCESSIBILITY_STANDARDS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] as const;

export class AccessibilityModule {
  private readonly standards: string[];
  private readonly reportDirectory: string;

  constructor() {
    // Get standards from configuration or use default
    const standardsConfig = config.get(EnvironmentVariables.ACCESSIBILITY_STANDARDS);
    this.standards = standardsConfig.split(',').map(s => s.trim());

    // Get absolute path to tests/testResults/accessibility
    // __dirname is tests/utils, so go up one level to tests, then into testResults/accessibility
    const absoluteDir = path.resolve(__dirname, '..', 'testResults', 'accessibility');

    // axe-html-reporter always treats outputDir as relative and prepends cwd,
    // so we need to provide a relative path from cwd to the target directory
    this.reportDirectory = path.relative(process.cwd(), absoluteDir);

    // Ensure report directory exists (use absolute path for fs operations)
    this.ensureReportDirectoryExists(absoluteDir);
  }

  /**
   * Run accessibility check on a page
   * @param pageOrPageObject - Playwright Page object or PageObject with page property
   * @param pageName - Name identifier for the page (used in report naming)
   * @param prefix - Optional prefix for the report filename
   * @returns Array of accessibility errors found
   */
  async runAccessibilityCheck(
    pageOrPageObject: Page | { page: Page },
    pageName: string,
    prefix: string = ''
  ): Promise<Result[]> {
    const page = 'page' in pageOrPageObject ? pageOrPageObject.page : pageOrPageObject;
    const accessErrors: Result[] = [];

    console.log(`🔍 Running accessibility check on: ${pageName}`);
    console.log(`📋 Testing against standards: ${this.standards.join(', ')}`);

    // Verify page title
    await this.verifyPageTitle(page);

    // Run accessibility scan
    const scanResult: AxeResults = await new AxeBuilder({ page })
      .withTags(this.standards)
      .analyze();

    // Generate HTML report
    await this.createHtmlAccessibilityReport(scanResult, pageName, prefix);

    // Collect violations
    scanResult.violations.forEach((element) => {
      accessErrors.push(element);
    });

    if (accessErrors.length > 0) {
      console.log(`❌ ${accessErrors.length} accessibility errors found on ${pageName}`);
      this.logViolations(accessErrors, pageName);
    } else {
      console.log(`✅ No accessibility violations found on ${pageName}`);
    }

    return accessErrors;
  }

  /**
   * Verify page has a title
   */
  private async verifyPageTitle(page: Page): Promise<void> {
    const title = await page.title();
    if (!title || title.trim().length === 0) {
      console.warn(`⚠️  Warning: Page has no title`);
    }
  }

  /**
   * Create HTML accessibility report
   */
  private async createHtmlAccessibilityReport(
    scanResult: AxeResults,
    pageName: string,
    prefix: string = ''
  ): Promise<void> {
    const accessibilityReportPath = this.reportDirectory;
    const accessibilityReportHtml =
      prefix === ''
        ? `${pageName}-accessibility-report.html`
        : `${prefix}-${pageName}-accessibility-report.html`;

    // Ensure directory exists
    const absolutePath = path.resolve(__dirname, '..', 'testResults', 'accessibility');
    if (!existsSync(absolutePath)) {
      mkdirSync(absolutePath, { recursive: true });
    }

    createHtmlReport({
      results: scanResult,
      options: {
        projectKey: `${pageName}`,
        outputDir: accessibilityReportPath,
        reportFileName: accessibilityReportHtml
      }
    });

    console.log(`📄 Report generated: ${accessibilityReportPath}/${accessibilityReportHtml}`);
  }

  /**
   * Log violations to console for debugging
   */
  private logViolations(violations: Result[], pageName: string): void {
    violations.forEach((violation, index) => {
      console.log(`\n${index + 1}. ${violation.id}: ${violation.description}`);
      console.log(`   Impact: ${violation.impact}`);
      console.log(`   Help: ${violation.help}`);
      console.log(`   Affected nodes: ${violation.nodes.length}`);

      violation.nodes.slice(0, 3).forEach((node, nodeIndex) => {
        console.log(`   ${nodeIndex + 1}) ${node.html.substring(0, 100)}...`);
      });

      if (violation.nodes.length > 3) {
        console.log(`   ... and ${violation.nodes.length - 3} more node(s)`);
      }
    });
  }

  /**
   * Ensure report directory exists
   */
  private ensureReportDirectoryExists(absolutePath: string): void {
    if (!existsSync(absolutePath)) {
      mkdirSync(absolutePath, { recursive: true });
      console.log(`📁 Created accessibility report directory: ${absolutePath}`);
    }
  }

  /**
   * Get current standards being used
   */
  getStandards(): string[] {
    return [...this.standards];
  }
}

// Export singleton instance
export const accessibilityModule = new AccessibilityModule();
