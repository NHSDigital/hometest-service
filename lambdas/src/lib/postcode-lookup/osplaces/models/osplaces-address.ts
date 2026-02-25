export interface OSPlacesAddress {
  uprn: string;
  address: string;
  buildingNumber?: string;
  buildingName?: string;
  subBuildingName?: string;
  dependentThoroughfare?: string;
  thoroughfare?: string;
  doubleDependentLocality?: string;
  dependentLocality?: string;
  postTown: string;
  postcode: string;
  localCustodianCode?: string;
  localCustodianCodeDescription?: string;
}
