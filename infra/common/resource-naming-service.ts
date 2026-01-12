export class ResourceNamingService {
  readonly envName: string;

  constructor(envName: string) {
    this.envName = envName;
  }

  getEnvSpecificResourceName(
    resourceName: string,
    nhcName: string = 'nhc'
  ): string {
    return this.camelCase(`${this.envName}-${nhcName}-${resourceName}`);
  }

  private camelCase(text: string): string {
    return text.replace(/-([a-z])/gi, function (all, letter) {
      return letter.toUpperCase();
    });
  }
}
