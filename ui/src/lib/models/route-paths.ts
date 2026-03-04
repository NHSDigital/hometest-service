export enum RoutePath {
  HomePage = "/",
  LoginPage = "/login",
  CallbackPage = "/callback",
  GetSelfTestKitPage = "/get-self-test-kit-for-HIV",
  OrderTrackingPage = "/orders/:orderId/tracking",
  TestResultsPage = "/orders/:orderId/results",
  HomeTestPrivacyPolicyPage = "/home-test-privacy-policy",
  SuppliersTermsConditions = "/suppliers-terms-conditions",
}

export enum JourneyStepNames {
  EnterAddressManually = "enter-address-manually",
  EnterDeliveryAddress = "enter-delivery-address",
  NoAddressFound = "no-address-found",
  SelectDeliveryAddress = "select-delivery-address",
  HowComfortablePrickingFinger = "how-comfortable-pricking-finger",
  BloodSampleGuide = "blood-sample-guide",
  EnterMobileNumber = "enter-mobile-phone-number",
  CheckYourAnswers = "check-your-answers",
  ConfirmMobileNumber = "confirm-mobile-phone-number",
  SuppliersTermsConditions = "suppliers-terms-conditions",
}
