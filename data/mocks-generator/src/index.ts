import { NewPatientsMockPatientGroup } from './scenarios/new-patients-group';
import { NewPatientsForEligiblityChecksMockPatientGroup } from './scenarios/new-patients-eligiblity-check-group';
import { PatientsWithCompletedSectionsMockPatientGroup } from './scenarios/patients-with-completed-sections-group';
import { PatientsWithAlcoholResultsMockPatientGroup } from './scenarios/patients-with-alcohol-results-group';
import { PatientsWithBloodPressureResultsMockPatientGroup } from './scenarios/patients-with-blood-pressure-results';
import { PatientsWithBmiResultsMockPatientGroup } from './scenarios/patients-with-bmi-results';
import type { MockPatientGroup } from './mock-patient-group';
import { MockDataGenerationService } from './mock-data-generation-service';
import { PatientsWithCholesterolResultsMockPatientGroup } from './scenarios/patients-with-cholesterol-results';
import { PatientsWithDiabetesResultsMockPatientGroup } from './scenarios/patients-with-diabetes-results';
import { PatientsWithFailedAPICallsMockPatientGroup } from './scenarios/patients-with-failed-api-calls';
import { PatientsWithPartialLabResultsMockPatientGroup } from './scenarios/patients-with-partial-lab-results';
import { PatientsWithPhysicalActivityResultsMockPatientGroup } from './scenarios/patients-with-physical-activity-results';
import { PatientsResultsCareCardsMockPatientGroup } from './scenarios/patients-with-results-care-cards';
import { PatientsSmokingResultsMockPatientGroup } from './scenarios/patients-with-smoking-results';
import { PatientsWithDataModelVersionOutdatedMockPatientGroup } from './scenarios/patients-with-data-model-version-outdated';
import { PatientsWithExpiredHealthChecks } from './scenarios/patients-with-expired-health-checks';

/**
 * Ordered list of mock patient groups displayed on the mock start page.
 *
 * Notes / conventions:
 * - Order matters: it's used both for display and deterministic generation of NHS numbers & patientIds
 *   (derived from group index + patient index).
 * - Some patients are referenced in automated tests; reordering or removing groups/patients
 *   may break those tests that rely on specific generated identifiers.
 * - In order to create a new group implement a class that extends MockPatientGroup class in the scenarios folder
 *   and add it to the list below.
 */
const mockPatientGroups: MockPatientGroup[] = [
  new NewPatientsMockPatientGroup(),
  new NewPatientsForEligiblityChecksMockPatientGroup(),
  new PatientsWithCompletedSectionsMockPatientGroup(),
  new PatientsWithAlcoholResultsMockPatientGroup(),
  new PatientsWithBloodPressureResultsMockPatientGroup(),
  new PatientsWithBmiResultsMockPatientGroup(),
  new PatientsWithCholesterolResultsMockPatientGroup(),
  new PatientsWithDiabetesResultsMockPatientGroup(),
  new PatientsWithPartialLabResultsMockPatientGroup(),
  new PatientsWithPhysicalActivityResultsMockPatientGroup(),
  new PatientsResultsCareCardsMockPatientGroup(),
  new PatientsSmokingResultsMockPatientGroup(),
  new PatientsWithFailedAPICallsMockPatientGroup(),
  new PatientsWithDataModelVersionOutdatedMockPatientGroup(),
  new PatientsWithExpiredHealthChecks()
];

new MockDataGenerationService().generateMockData(mockPatientGroups);
