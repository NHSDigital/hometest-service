import {
  Bundle,
  CodeableConcept,
  Coding,
  Extension,
  Identifier,
  Resource,
} from "@medplum/fhirtypes";

export class FhirUtils {
  static findResource<T extends Resource>(
    bundle: Bundle,
    resourceType: T["resourceType"],
  ): T | null {
    return (
      (bundle.entry?.find((e) => e.resource?.resourceType === resourceType)
        ?.resource as T) ?? null
    );
  }

  static findExtension(
    resource: { extension?: Extension[] },
    url: string,
  ): Extension | null {
    return resource.extension?.find((ext) => ext.url === url) ?? null;
  }

  static findCoding(
    concept: CodeableConcept | undefined,
    system: string,
  ): Coding | null {
    return concept?.coding?.find((c) => c.system === system) ?? null;
  }

  static findSubExtension(
    ext: Extension | null,
    url: string,
  ): Extension | null {
    return ext?.extension?.find((e) => e.url === url) ?? null;
  }

  static findIdentifier(
    resource: { identifier?: Identifier[] },
    system: string,
  ): Identifier | null {
    return resource.identifier?.find((id) => id.system === system) ?? null;
  }
}
