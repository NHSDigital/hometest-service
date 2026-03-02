export enum RoutePath {
  HomePage = "/",
  LoginPage = "/login",
  CallbackPage = "/callback",
  GetSelfTestKitPage = "/get-self-test-kit-for-HIV",
  OrderTrackingPage = "/orders/:orderId/tracking",
  HomeTestPrivacyPolicyPage = "/home-test-privacy-policy",
}

export enum JourneyStepNames {
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
}
