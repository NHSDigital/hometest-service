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

    // Get report directory from configuration
    const outputDir = config.get(EnvironmentVariables.REPORTING_OUTPUT_DIRECTORY);
    
    // Ensure reports are always written to tests directory regardless of execution context
    const baseDir = path.basename(process.cwd()) === 'tests' ? '.' : './tests';
    this.reportDirectory = path.join(baseDir, outputDir, 'accessibility');

    // Ensure report directory exists
    this.ensureReportDirectoryExists();
  }

  /**
   * Run accessibility check on a page
   * @param pageOrPageObject - Playwright Page object or PageObject with page property
   * @param pageName - Name identifier for the page (used in report naming)
   * @returns true if violations found, false if no violations
   */
  async runAccessibilityCheck(pageOrPageObject: Page | { page: Page }, pageName: string): Promise<boolean> {
    const page = 'page' in pageOrPageObject ? pageOrPageObject.page : pageOrPageObject;

    console.log(`🔍 Running accessibility check on: ${pageName}`);
    console.log(`📋 Testing against standards: ${this.standards.join(', ')}`);

    // Run accessibility scan
    const scanResult: AxeResults = await new AxeBuilder({ page })
      .withTags(this.standards)
      .analyze();

    // Generate HTML report
    await this.generateReport(scanResult, pageName);

    const hasViolations = scanResult.violations.length > 0;

    if (hasViolations) {
      console.log(`❌ Found ${scanResult.violations.length} accessibility violation(s) on ${pageName}`);
      this.logViolations(scanResult.violations, pageName);
    } else {
      console.log(`✅ No accessibility violations found on ${pageName}`);
    }

    return hasViolations;
  }

  /**
   * Generate HTML accessibility report
   */
  private async generateReport(scanResult: AxeResults, pageName: string): Promise<void> {
    const reportFileName = `${pageName}-accessibility-report.html`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    createHtmlReport({
      results: scanResult,
      options: {
        projectKey: pageName,
        outputDir: this.reportDirectory,
        reportFileName: `${timestamp}-${reportFileName}`,
      },
    });

    console.log(`📄 Report generated: ${this.reportDirectory}/${timestamp}-${reportFileName}`);
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
  private ensureReportDirectoryExists(): void {
    if (!existsSync(this.reportDirectory)) {
      mkdirSync(this.reportDirectory, { recursive: true });
      console.log(`📁 Created accessibility report directory: ${this.reportDirectory}`);
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
