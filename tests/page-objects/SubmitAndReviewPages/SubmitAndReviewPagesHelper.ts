import { type Page } from '@playwright/test';
import { CheckYourAnswersReviewSubmitPage } from './CheckYourAnswersReviewSubmitPage';

export class SubmitAndReviewPages {
  readonly checkYourAnswersReviewSubmitPage: CheckYourAnswersReviewSubmitPage;

  constructor(page: Page) {
    this.checkYourAnswersReviewSubmitPage =
      new CheckYourAnswersReviewSubmitPage(page);
  }
}
