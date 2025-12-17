import { AddressApiResource } from './AddressApiResource';
import { EventsApiResource } from './EventsApiResource';
import { HealthCheckApiResource } from './HealthCheckApiResource';
import { LoginApiResource } from './LoginApiResource';
import { RumIdentityApiResource } from './RumIdentityApiResource';
import { PatientApiResource } from './PatientApiResource';
import { AuthenticationApiResource } from './AuthenticationApiResource';

export class BackendApiResource {
  public readonly address: AddressApiResource;
  public readonly login: LoginApiResource;
  public readonly rumIdentity: RumIdentityApiResource;
  public readonly healthCheck: HealthCheckApiResource;
  public readonly events: EventsApiResource;
  public readonly patient: PatientApiResource;
  public readonly auth: AuthenticationApiResource;

  constructor() {
    this.address = new AddressApiResource();
    this.login = new LoginApiResource();
    this.rumIdentity = new RumIdentityApiResource();
    this.healthCheck = new HealthCheckApiResource();
    this.events = new EventsApiResource();
    this.patient = new PatientApiResource();
    this.auth = new AuthenticationApiResource();
  }
}
