export enum RoutePath {
  HomePage = "/",
  LoginPage = "/login",
  CallbackPage = "/callback",
  GetSelfTestKitPage = "/get-self-test-kit-for-HIV",
  OrderTrackingPage = "/orders/:orderId/tracking",
  TestResultsPage = "/orders/:orderId/results",
  HomeTestPrivacyPolicyPage = "/home-test-privacy-policy",
  SuppliersTermsConditions = "/suppliers-terms-conditions",
  SuppliersPrivacyPolicy = "/suppliers-privacy-policy",
}

// TODO: Rename to reference these are the paths for the HIV test journey, not the entire app
// These enums should be looked at in combination with NavigationContext to ensure they are in sync and used correctly across the app
// As it stands GetSelfTestKitPage is incorrectly placed here due to logic in the context
export enum JourneyStepNames {
  GetSelfTestKitPage = "get-self-test-kit-for-HIV",
  EnterAddressManually = "enter-address-manually",
  EnterDeliveryAddress = "enter-delivery-address",
  NoAddressFound = "no-address-found",
  SelectDeliveryAddress = "select-delivery-address",
  HowComfortablePrickingFinger = "how-comfortable-pricking-finger",
  CannotUseServiceUnder18 = "cannot-use-service-under-18",
  BloodSampleGuide = "blood-sample-guide",
  EnterMobileNumber = "enter-mobile-phone-number",
  CheckYourAnswers = "check-your-answers",
  ConfirmMobileNumber = "confirm-mobile-phone-number",
  OrderSubmitted = "order-submitted",
  KitNotAvailableInArea = "kit-not-available-in-area",
  SuppliersTermsConditions = "suppliers-terms-conditions",
  GoToClinic = "go-to-clinic",
  SuppliersPrivacyPolicy = "suppliers-privacy-policy",
}
