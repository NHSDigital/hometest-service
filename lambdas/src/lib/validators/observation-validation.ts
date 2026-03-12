import { Observation } from "fhir/r4";

const OBSERVATION_INTERPRETATION_SYSTEM =
  "https://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation";
const NORMAL_CODE = "N";

export class ObservationValidation {
  static isNormalResult(observation: Observation | undefined): boolean {
    if (!observation?.interpretation) {
      return false;
    }

    for (const interpretation of observation.interpretation) {
      if (!interpretation.coding) {
        continue;
      }

      const observationCoding = interpretation.coding.find(
        (coding) => coding.system === OBSERVATION_INTERPRETATION_SYSTEM,
      );

      if (observationCoding?.code === NORMAL_CODE) {
        return true;
      }
    }

    return false;
  }
}
