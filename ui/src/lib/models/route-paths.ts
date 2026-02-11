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
}
