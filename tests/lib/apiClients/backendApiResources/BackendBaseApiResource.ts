import { BackendApiClient } from '../BackendApiClient';

export abstract class BackendBaseApiResource {
  protected readonly backendApiResource: BackendApiClient;

  constructor() {
    this.backendApiResource = new BackendApiClient();
  }
}
