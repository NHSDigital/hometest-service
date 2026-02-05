export enum RoutePath {
  HomePage = "/",
  GetSelfTestKitPage = "/get-self-test-kit-for-HIV",
  OrderTrackingPage = "/orders/:orderId/tracking",
}

export enum JourneyStepNames {
  EnterAddressManually = "enter-address-manually",
  EnterDeliveryAddress = "enter-delivery-address",
  NoAddressFound = "no-address-found",
}
