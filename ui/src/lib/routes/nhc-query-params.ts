enum QueryParamNames {
  ASSERTED_LOGIN_IDENTITY = 'assertedLoginIdentity',
  URL_SOURCE = 's'
}

export class NhcQueryParams {
  readonly assertedLoginIdentity: string | null;
  readonly urlSource: string | null;

  constructor(searchParams: string) {
    const params = new URLSearchParams(searchParams);
    this.assertedLoginIdentity = params.get(
      QueryParamNames.ASSERTED_LOGIN_IDENTITY
    );
    this.urlSource = params.get(QueryParamNames.URL_SOURCE);
  }
}
