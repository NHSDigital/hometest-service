import { type Page } from '@playwright/test';
import { ContactYourGpSurgeryPage } from './ContactYourGpSurgeryPage';
import { ReadDeclarationPage } from './ReadDeclarationPage';

export class DeclarationPages {
  readonly contactYourGpSurgeryPage: ContactYourGpSurgeryPage;
  readonly readDeclarationPage: ReadDeclarationPage;

  constructor(page: Page) {
    this.contactYourGpSurgeryPage = new ContactYourGpSurgeryPage(page);
    this.readDeclarationPage = new ReadDeclarationPage(page);
  }
}
