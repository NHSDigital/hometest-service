import { CodeSecurityPage } from './CodeSecurityPage';
import { NhsLoginConsent } from './NhsLoginConsent';
import { NHSFirstPage } from './NHSFirstPage';
import { NHSEmailAndPasswordPage } from './NHSEmailAndPasswordPage';
import { ConsentConfirmation } from './NHSConsentConfirmation';
import type { Page } from '@playwright/test';
import { NHSAppRedirectorPage } from './NHSAppRedirectorPage';
import { NHSAppTermsAndConditionsPage } from './NHSAppTermsAndConditionsPage';

export class NhsLoginPages {
  readonly codeSecurityPage: CodeSecurityPage;
  readonly nhsLoginConsent: NhsLoginConsent;
  readonly nhsFirstPage: NHSFirstPage;
  readonly nhsEmailPage: NHSEmailAndPasswordPage;
  readonly nhsAppRedirectorPage: NHSAppRedirectorPage;
  readonly nhsAppTermsAndConditionsPage: NHSAppTermsAndConditionsPage;
  readonly consentConfirmation: ConsentConfirmation;

  constructor(page: Page) {
    this.codeSecurityPage = new CodeSecurityPage(page);
    this.nhsLoginConsent = new NhsLoginConsent(page);
    this.nhsFirstPage = new NHSFirstPage(page);
    this.nhsEmailPage = new NHSEmailAndPasswordPage(page);
    this.consentConfirmation = new ConsentConfirmation(page);
    this.nhsAppRedirectorPage = new NHSAppRedirectorPage(page);
    this.nhsAppTermsAndConditionsPage = new NHSAppTermsAndConditionsPage(page);
  }
}
