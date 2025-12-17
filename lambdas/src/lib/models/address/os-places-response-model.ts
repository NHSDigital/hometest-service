export interface IOSPlacesResponseModel {
  header: IOSPlacesHeader;
  results: IOSPlacesResult[];
}

export interface IOSPlacesHeader {
  uri: string;
  query: string;
  offset: number;
  totalresults: number;
  format: string;
  dataset: string;
  lr: string;
  maxresults: number;
  epoch: string;
  output_srs: string;
}

export interface IOSPlacesResult {
  DPA: IDPAAddress;
}
export interface IDPAAddress {
  UPRN: string;
  UDPRN: string;
  ADDRESS: string;
  PO_BOX_NUMBER: string;
  ORGANISATION_NAME: string;
  DEPARTMENT_NAME: string;
  SUB_BUILDING_NAME: string;
  BUILDING_NAME: string;
  BUILDING_NUMBER: string;
  DEPENDENT_THOROUGHFARE_NAME: string;
  THOROUGHFARE_NAME: string;
  DOUBLE_DEPENDENT_LOCALITY: string;
  DEPENDENT_LOCALITY: string;
  POST_TOWN: string;
  POSTCODE: string;
  RPC: string;
  X_COORDINATE: number;
  Y_COORDINATE: number;
  LNG: string;
  LAT: string;
  STATUS: string;
  MATCH: string;
  MATCH_DESCRIPTION: string;
  LANGUAGE: string;
  LOCAL_CUSTODIAN_CODE: number;
  LOCAL_CUSTODIAN_CODE_DESCRIPTION: string;
  CLASSIFICATION_CODE: string;
  CLASSIFICATION_CODE_DESCRIPTION: string;
  POSTAL_ADDRESS_CODE: string;
  POSTAL_ADDRESS_CODE_DESCRIPTION: string;
  LOGICAL_STATUS_CODE: string;
  BLPU_STATE_CODE: string;
  BLPU_STATE_CODE_DESCRIPTION: string;
  TOPOGRAPHY_LAYER_TOID: string;
  PARENT_UPRN: string;
  LAST_UPDATE_DATE: string;
  ENTRY_DATE: string;
  LEGAL_NAME: string;
  BLPU_STATE_DATE: string;
}
