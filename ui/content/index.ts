/**
 * Barrel export for the content module.
 */

export { content, getCommonContent, getPageContent } from "./ContentService";
export { validateContent, isValidContentFile, assertValidContent } from "./ContentValidator";
export type {
  ContentFile,
  CommonContent,
  PagesContent,
  StartPageContent,
  EnterDeliveryAddressContent,
  EnterAddressManuallyContent,
  NoAddressFoundContent,
  ServiceErrorContent,
  OrderTrackingContent,
  TestResultsContent,
  NavigationContent,
  ValidationMessages,
  CommonLinks,
  ErrorSummaryContent,
  OrderStatusContent,
  OrderStatusHeaderContent,
  OrderStatusesContent,
  ConfirmedStatusContent,
  DispatchedStatusContent,
  ReceivedStatusContent,
  ReadyStatusContent,
  HelpLinksContent,
  MoreInformationContent,
  AboutServiceContent,
  FeedbackContent,
  FooterContent,
  KitNotAvailableInAreaContent,
} from "./schema";
