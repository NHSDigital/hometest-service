import AxeBuilder from '@axe-core/playwright';
import {
  createHtmlAccessibilityReport,
  tagList
} from '../AccessibilityTestReportHelper';
import type { Result } from 'axe-core';
import type { HTCPage } from '../../page-objects/HTCPage';
import { expect, type Page } from '@playwright/test';

export enum CommonFlowStrategy {
  CUSTOM_DATA = 'CUSTOM_DATA'
}

export interface SectionFlowStrategy {
  withAccessibilityCheck: boolean;
  strategyType: CommonFlowStrategy | string;
}

export abstract class BaseSectionFlow<TData = unknown> {
  protected readonly page: Page;
  protected _accessErrors: Result[] = [];
  protected data: TData;
  protected withAccessibility: boolean;

  constructor(data: TData, page: Page, withAccessibility: boolean = false) {
    this.page = page;
    this.data = data;
    this.withAccessibility = withAccessibility;
  }

  abstract completeSection(): Promise<void>;

  protected async runAccessibilityCheck(
    pageObj: HTCPage,
    sectionName: string
  ): Promise<void> {
    if (this.withAccessibility) {
      const accessibilityScanResults = await new AxeBuilder({ page: this.page })
        .withTags(tagList)
        .analyze();
      this._accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          typeof pageObj,
          sectionName,
          pageObj
        ))
      );
    } else {
      console.log(
        `Skipping accessibility checks for ${sectionName} as per strategy configuration.`
      );
    }
  }

  protected verifyAccessibilityErrors(): void {
    if (this.withAccessibility) {
      expect(
        this._accessErrors.length,
        `Accessibility errors found: ${JSON.stringify(this._accessErrors)}`
      ).toBe(0);
    }
  }
}
