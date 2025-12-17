import { OrderBloodTestKitPage } from './OrderBloodTestKitPage';
import { EnterDeliveryAddressPage } from './EnterDeliveryAddressPage';
import { EnterPhoneNumberPage } from './EnterPhoneNumberPage';
import { ConfirmDetailsPage } from './ConfirmDetailsPage';
import { BloodTestOrderedPage } from './BloodTestOrderedPage';
import { FindDeliveryAddressPage } from './FindDeliveryAddressPage';
import { NeedBloodTestPage } from './NeedBloodTestPage';
import { NoAddressFoundPage } from './NoAddressFoundPage';
import { SelectDeliveryAddressPage } from './SelectDeliveryAddressPage';
import { type Page } from '@playwright/test';

export class BloodTestPages {
  orderBloodTestKitPage: OrderBloodTestKitPage;
  enterDeliveryAddressPage: EnterDeliveryAddressPage;
  enterPhoneNumberPage: EnterPhoneNumberPage;
  confirmDetailsPage: ConfirmDetailsPage;
  bloodTestOrderedPage: BloodTestOrderedPage;
  findDeliveryAddressPage: FindDeliveryAddressPage;
  needBloodTestPage: NeedBloodTestPage;
  noAddressFoundPage: NoAddressFoundPage;
  selectDeliveryAddressPage: SelectDeliveryAddressPage;

  constructor(page: Page) {
    this.orderBloodTestKitPage = new OrderBloodTestKitPage(page);
    this.enterDeliveryAddressPage = new EnterDeliveryAddressPage(page);
    this.enterPhoneNumberPage = new EnterPhoneNumberPage(page);
    this.confirmDetailsPage = new ConfirmDetailsPage(page);
    this.bloodTestOrderedPage = new BloodTestOrderedPage(page);
    this.findDeliveryAddressPage = new FindDeliveryAddressPage(page);
    this.needBloodTestPage = new NeedBloodTestPage(page);
    this.noAddressFoundPage = new NoAddressFoundPage(page);
    this.selectDeliveryAddressPage = new SelectDeliveryAddressPage(page);
  }
}
