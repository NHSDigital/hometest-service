import { test as base } from '@playwright/test';

import { TaskListPage } from './TaskListPage';
import { WafErrorPage } from './WafErrorPage';
import { TermsAndConditionsPage } from './TermsAndConditionsPage/TermsAndConditionsPage';
import { HealthCheckVersionMigrationPage } from './HealthCheckVersionMigrationPage/HealthCheckVersionMigrationPage';
import { NotEligiblePage } from './NotEligiblePage';
import { CompleteHealthCheckFirstPage } from './CompleteHealthCheckFirstPage';
import { ContactYourGpSurgeryPage } from './DeclarationPages/ContactYourGpSurgeryPage';
import { ReadDeclarationPage } from './DeclarationPages/ReadDeclarationPage';
import { CheckYourAnswersReviewSubmitPage } from './SubmitAndReviewPages/CheckYourAnswersReviewSubmitPage';
import { ConsentNotGivenErrorPage } from './ConsentNotGivenErrorPage';
import { NhsLoginError } from './NhsLoginError';
import { LogoutPage } from './LogoutPage';
import { HealthCheckExpiredPage } from './HealthCheckExpiredPage';
import { OdsNhsNumberNotEligiblePage } from './OdsNhsNumberNotEligiblePage';
import {
  TownsendPostcodePage,
  AntipsychoticMedicationPage,
  CheckYourAnswersPage as AboutYouCheckYourAnswersPage,
  DetailedEthnicGroupAsianPage,
  DoYouSmokePage,
  ErectileDysfunctionPage,
  EthnicGroupPage,
  FamilyDiabetesHistoryPage,
  FamilyHeartAttackHistoryPage,
  LupusPage,
  MigrainesPage,
  RheumatoidArthritisPage,
  SevereMentalIllnessPage,
  SexAssignedAtBirthPage,
  SteroidPage,
  DetailedEthnicGroupBlackPage,
  DetailedEthnicGroupMixedEthnicPage,
  DetailedEthnicGroupWhitePage,
  DetailedOtherEthnicGroupPage
} from './AboutYouPages';

import {
  CheckYourAnswersPage as AlcoholConsumptionCheckYourAnswersPage,
  DoYouDrinkAlcoholPage,
  HowOftenAlcoholPage,
  HowManyUnitsOfAlcoholPage,
  SixOrMoreUnitsOfAlcoholPage,
  AlcoholFailedObligationsPage,
  AlcoholMorningDrinkPage,
  AlcoholGuiltPage,
  AlcoholMemoryLossPage,
  AlcoholInjuredPage,
  AlcoholRelativeConcernedPage,
  UnableToStopDrinkingPage
} from './AlcoholConsumptionPages';

import {
  CheckYourAnswersPage as BloodPressureCheckYourAnswersPage,
  BloodPressureVeryHighShutterPage,
  LowBloodPressureSymptomsPage,
  CheckBloodPressurePage,
  ConfirmBloodPressureLocationPage,
  ConfirmBloodPressureReadingsPage,
  EnterYourReadingPage,
  LowBloodPressureShutterPage,
  NeedBloodPressurePage
} from './BloodPressurePages';

import {
  OrderBloodTestKitPage,
  EnterDeliveryAddressPage,
  EnterPhoneNumberPage,
  ConfirmDetailsPage,
  BloodTestOrderedPage,
  FindDeliveryAddressPage,
  NeedBloodTestPage,
  NoAddressFoundPage,
  SelectDeliveryAddressPage
} from './BloodTestPages';

import {
  CheckYourAnswersPage as PhysicalActivityCheckYourAnswersPage,
  HoursExercisedPage,
  HoursWalkedPage,
  HoursCycledPage,
  WorkActivityPage,
  HoursHouseworkPage,
  HoursGardeningPage,
  WalkingPacePage
} from './PhysicalActivityPages';

import {
  ContactYourGPSurgeryAboutYourNHSHealthCheckPage,
  HaveYouCompletedNhsHealthCheckPage,
  PreExistingHealthConditionsNotEligiblePage,
  PreExistingHealthConditionsPage,
  PreviousHealthCheckCompletedPage,
  WhoShouldNotUseThisOnlineServicePage
} from './EligibilityPages';

import {
  CheckYourAnswersPage as BodyMeasurementsCheckYourAnswersPage,
  DiabetesShutterPage,
  MeasureYourWaistPage,
  WhatIsYourHeightPage,
  WhatIsYourWaistMeasurementPage,
  WhatIsYourWeightPage
} from './BodyMeasurementsPages';

import {
  CodeSecurityPage,
  NHSEmailAndPasswordPage,
  NhsLoginConsent,
  NHSFirstPage,
  ConsentConfirmation,
  NHSAppRedirectorPage,
  NHSAppTermsAndConditionsPage
} from './NHSLogin';

import {
  AlcoholResultsPage,
  BloodPressureResultsPage,
  BMIResultsPage,
  CholesterolResultsPage,
  DiabetesResultsPage,
  DementiaResultsPage,
  MainResultsPage,
  PhysicalActivityResultsPage,
  SmokingResultsPage
} from './ResultsPages';

export interface MyFixtures {
  taskListPage: TaskListPage;
  termsAndConditionsPage: TermsAndConditionsPage;
  healthCheckVersionMigrationPage: HealthCheckVersionMigrationPage;
  notEligiblePage: NotEligiblePage;
  completeHealthCheckFirstPage: CompleteHealthCheckFirstPage;
  consentNotGivenErrorPage: ConsentNotGivenErrorPage;
  nhsLoginError: NhsLoginError;
  logoutPage: LogoutPage;
  healthCheckExpiredPage: HealthCheckExpiredPage;
  odsNhsNumberNotEligiblePage: OdsNhsNumberNotEligiblePage;
  // Nhs Login Pages
  codeSecurityPage: CodeSecurityPage;
  nhsLoginConsent: NhsLoginConsent;
  nhsFirstPage: NHSFirstPage;
  nhsAppRedirectorPage: NHSAppRedirectorPage;
  nhsAppTermsAndConditionsPage: NHSAppTermsAndConditionsPage;
  emailPage: NHSEmailAndPasswordPage;
  consentConfirmation: ConsentConfirmation;
  // About You Pages
  familyHeartAttackHistoryPage: FamilyHeartAttackHistoryPage;
  townsendPostcodePage: TownsendPostcodePage;
  familyDiabetesHistoryPage: FamilyDiabetesHistoryPage;
  sexAssignedAtBirthPage: SexAssignedAtBirthPage;
  ethnicGroupPage: EthnicGroupPage;
  detailedEthnicGroupAsianPage: DetailedEthnicGroupAsianPage;
  detailedEthnicGroupBlackPage: DetailedEthnicGroupBlackPage;
  detailedEthnicGroupMixedEthnicPage: DetailedEthnicGroupMixedEthnicPage;
  detailedEthnicGroupWhitePage: DetailedEthnicGroupWhitePage;
  detailedOtherEthnicGroupPage: DetailedOtherEthnicGroupPage;
  doYouSmokePage: DoYouSmokePage;
  lupusPage: LupusPage;
  severeMentalIllnessPage: SevereMentalIllnessPage;
  antipsychoticMedicationPage: AntipsychoticMedicationPage;
  migrainesPage: MigrainesPage;
  erectileDysfunctionPage: ErectileDysfunctionPage;
  steroidPage: SteroidPage;
  rheumatoidArthritisPage: RheumatoidArthritisPage;
  checkYourAnswersPageAboutYou: AboutYouCheckYourAnswersPage;
  // Alcohol Consumption
  doYouDrinkAlcoholPage: DoYouDrinkAlcoholPage;
  howOftenAlcoholPage: HowOftenAlcoholPage;
  howManyUnitsOfAlcoholPage: HowManyUnitsOfAlcoholPage;
  sixOrMoreUnitsOfAlcoholPage: SixOrMoreUnitsOfAlcoholPage;
  alcoholFailedObligationsPage: AlcoholFailedObligationsPage;
  alcoholMorningDrinkPage: AlcoholMorningDrinkPage;
  alcoholGuiltPage: AlcoholGuiltPage;
  alcoholMemoryLossPage: AlcoholMemoryLossPage;
  alcoholInjuredPage: AlcoholInjuredPage;
  alcoholRelativeConcernedPage: AlcoholRelativeConcernedPage;
  checkYourAnswersPageAlcoholConsumption: AlcoholConsumptionCheckYourAnswersPage;
  unableToStopDrinkingPage: UnableToStopDrinkingPage;
  // Blood Pressure Pages
  bloodPressureVeryHighShutterPage: BloodPressureVeryHighShutterPage;
  checkYourAnswersPageBloodPressure: BloodPressureCheckYourAnswersPage;
  checkBloodPressurePage: CheckBloodPressurePage;
  confirmBloodPressureLocationPage: ConfirmBloodPressureLocationPage;
  confirmBloodPressureReadingsPage: ConfirmBloodPressureReadingsPage;
  enterYourReadingPage: EnterYourReadingPage;
  lowBloodPressureShutterPage: LowBloodPressureShutterPage;
  lowBloodPressureSymptomsPage: LowBloodPressureSymptomsPage;
  needBloodPressurePage: NeedBloodPressurePage;
  // Blood Test Pages
  orderBloodTestKitPage: OrderBloodTestKitPage;
  enterDeliveryAddressPage: EnterDeliveryAddressPage;
  enterPhoneNumberPage: EnterPhoneNumberPage;
  confirmDetailsPage: ConfirmDetailsPage;
  bloodTestOrderedPage: BloodTestOrderedPage;
  findDeliveryAddressPage: FindDeliveryAddressPage;
  needBloodTestPage: NeedBloodTestPage;
  noAddressFoundPage: NoAddressFoundPage;
  selectDeliveryAddressPage: SelectDeliveryAddressPage;
  // Body Measurements Pages
  checkYourAnswersPageBodyMeasurements: BodyMeasurementsCheckYourAnswersPage;
  diabetesShutterPage: DiabetesShutterPage;
  measureYourWaistPage: MeasureYourWaistPage;
  whatIsYourHeightPage: WhatIsYourHeightPage;
  whatIsYourWaistMeasurementPage: WhatIsYourWaistMeasurementPage;
  whatIsYourWeightPage: WhatIsYourWeightPage;
  // Physical Activity Pages
  hoursExercisedPage: HoursExercisedPage;
  hoursWalkedPage: HoursWalkedPage;
  hoursCycledPage: HoursCycledPage;
  workActivityPage: WorkActivityPage;
  hoursHouseworkPage: HoursHouseworkPage;
  hoursGardeningPage: HoursGardeningPage;
  walkingPacePage: WalkingPacePage;
  checkYourAnswersPhysicalActivityPage: PhysicalActivityCheckYourAnswersPage;
  // Check Eligibility Pages
  contactYourGPSurgeryAboutYourNHSHealthCheckPage: ContactYourGPSurgeryAboutYourNHSHealthCheckPage;
  haveYouCompletedNhsHealthCheckPage: HaveYouCompletedNhsHealthCheckPage;
  preExistingHealthConditionsNotEligiblePage: PreExistingHealthConditionsNotEligiblePage;
  preExistingHealthConditionsPage: PreExistingHealthConditionsPage;
  previousHealthCheckCompletedPage: PreviousHealthCheckCompletedPage;
  whoShouldNotUseThisOnlineServicePage: WhoShouldNotUseThisOnlineServicePage;
  // Read Declaration Pages
  contactYourGpSurgeryPage: ContactYourGpSurgeryPage;
  readDeclarationPage: ReadDeclarationPage;
  // Review and Submit Pages
  checkYourAnswersReviewSubmitPage: CheckYourAnswersReviewSubmitPage;
  // Results Pages
  alcoholResultsPage: AlcoholResultsPage;
  bloodPressureResultsPage: BloodPressureResultsPage;
  bmiResultsPage: BMIResultsPage;
  cholesterolResultsPage: CholesterolResultsPage;
  diabetesResultsPage: DiabetesResultsPage;
  dementiaResultsPage: DementiaResultsPage;
  mainResultsPage: MainResultsPage;
  physicalActivityResultsPage: PhysicalActivityResultsPage;
  smokingResultsPage: SmokingResultsPage;
  // WAF Error Page
  wafErrorPage: WafErrorPage;
}

export const poFixture = base.extend<MyFixtures>({
  taskListPage: async ({ page }, use) => {
    await use(new TaskListPage(page));
  },
  termsAndConditionsPage: async ({ page }, use) => {
    await use(new TermsAndConditionsPage(page));
  },
  healthCheckVersionMigrationPage: async ({ page }, use) => {
    await use(new HealthCheckVersionMigrationPage(page));
  },
  completeHealthCheckFirstPage: async ({ page }, use) => {
    await use(new CompleteHealthCheckFirstPage(page));
  },
  notEligiblePage: async ({ page }, use) => {
    await use(new NotEligiblePage(page));
  },
  consentNotGivenErrorPage: async ({ page }, use) => {
    await use(new ConsentNotGivenErrorPage(page));
  },
  nhsLoginError: async ({ page }, use) => {
    await use(new NhsLoginError(page));
  },
  logoutPage: async ({ page }, use) => {
    await use(new LogoutPage(page));
  },
  healthCheckExpiredPage: async ({ page }, use) => {
    await use(new HealthCheckExpiredPage(page));
  },
  odsNhsNumberNotEligiblePage: async ({ page }, use) => {
    await use(new OdsNhsNumberNotEligiblePage(page));
  },

  // NHS Login

  nhsFirstPage: async ({ page }, use) => {
    await use(new NHSFirstPage(page));
  },
  nhsAppRedirectorPage: async ({ page }, use) => {
    await use(new NHSAppRedirectorPage(page));
  },
  nhsAppTermsAndConditionsPage: async ({ page }, use) => {
    await use(new NHSAppTermsAndConditionsPage(page));
  },
  codeSecurityPage: async ({ page }, use) => {
    await use(new CodeSecurityPage(page));
  },
  emailPage: async ({ page }, use) => {
    await use(new NHSEmailAndPasswordPage(page));
  },
  consentConfirmation: async ({ page }, use) => {
    await use(new ConsentConfirmation(page));
  },
  nhsLoginConsent: async ({ page }, use) => {
    await use(new NhsLoginConsent(page));
  },

  // Read Declaration Pages

  readDeclarationPage: async ({ page }, use) => {
    await use(new ReadDeclarationPage(page));
  },
  contactYourGpSurgeryPage: async ({ page }, use) => {
    await use(new ContactYourGpSurgeryPage(page));
  },

  // About You Pages

  familyHeartAttackHistoryPage: async ({ page }, use) => {
    await use(new FamilyHeartAttackHistoryPage(page));
  },
  townsendPostcodePage: async ({ page }, use) => {
    await use(new TownsendPostcodePage(page));
  },
  familyDiabetesHistoryPage: async ({ page }, use) => {
    await use(new FamilyDiabetesHistoryPage(page));
  },
  sexAssignedAtBirthPage: async ({ page }, use) => {
    await use(new SexAssignedAtBirthPage(page));
  },
  ethnicGroupPage: async ({ page }, use) => {
    await use(new EthnicGroupPage(page));
  },
  detailedEthnicGroupAsianPage: async ({ page }, use) => {
    await use(new DetailedEthnicGroupAsianPage(page));
  },
  detailedEthnicGroupBlackPage: async ({ page }, use) => {
    await use(new DetailedEthnicGroupBlackPage(page));
  },
  detailedEthnicGroupMixedEthnicPage: async ({ page }, use) => {
    await use(new DetailedEthnicGroupMixedEthnicPage(page));
  },
  detailedEthnicGroupWhitePage: async ({ page }, use) => {
    await use(new DetailedEthnicGroupWhitePage(page));
  },
  detailedOtherEthnicGroupPage: async ({ page }, use) => {
    await use(new DetailedOtherEthnicGroupPage(page));
  },
  doYouSmokePage: async ({ page }, use) => {
    await use(new DoYouSmokePage(page));
  },
  lupusPage: async ({ page }, use) => {
    await use(new LupusPage(page));
  },
  severeMentalIllnessPage: async ({ page }, use) => {
    await use(new SevereMentalIllnessPage(page));
  },
  antipsychoticMedicationPage: async ({ page }, use) => {
    await use(new AntipsychoticMedicationPage(page));
  },
  migrainesPage: async ({ page }, use) => {
    await use(new MigrainesPage(page));
  },
  erectileDysfunctionPage: async ({ page }, use) => {
    await use(new ErectileDysfunctionPage(page));
  },
  steroidPage: async ({ page }, use) => {
    await use(new SteroidPage(page));
  },
  rheumatoidArthritisPage: async ({ page }, use) => {
    await use(new RheumatoidArthritisPage(page));
  },
  checkYourAnswersPageAboutYou: async ({ page }, use) => {
    await use(new AboutYouCheckYourAnswersPage(page));
  },

  // Alcohol consumption

  doYouDrinkAlcoholPage: async ({ page }, use) => {
    await use(new DoYouDrinkAlcoholPage(page));
  },
  howOftenAlcoholPage: async ({ page }, use) => {
    await use(new HowOftenAlcoholPage(page));
  },
  howManyUnitsOfAlcoholPage: async ({ page }, use) => {
    await use(new HowManyUnitsOfAlcoholPage(page));
  },
  sixOrMoreUnitsOfAlcoholPage: async ({ page }, use) => {
    await use(new SixOrMoreUnitsOfAlcoholPage(page));
  },
  alcoholFailedObligationsPage: async ({ page }, use) => {
    await use(new AlcoholFailedObligationsPage(page));
  },
  alcoholMorningDrinkPage: async ({ page }, use) => {
    await use(new AlcoholMorningDrinkPage(page));
  },
  alcoholGuiltPage: async ({ page }, use) => {
    await use(new AlcoholGuiltPage(page));
  },
  alcoholMemoryLossPage: async ({ page }, use) => {
    await use(new AlcoholMemoryLossPage(page));
  },
  alcoholInjuredPage: async ({ page }, use) => {
    await use(new AlcoholInjuredPage(page));
  },
  alcoholRelativeConcernedPage: async ({ page }, use) => {
    await use(new AlcoholRelativeConcernedPage(page));
  },
  checkYourAnswersPageAlcoholConsumption: async ({ page }, use) => {
    await use(new AlcoholConsumptionCheckYourAnswersPage(page));
  },
  unableToStopDrinkingPage: async ({ page }, use) => {
    await use(new UnableToStopDrinkingPage(page));
  },

  // Blood Pressure

  bloodPressureVeryHighShutterPage: async ({ page }, use) => {
    await use(new BloodPressureVeryHighShutterPage(page));
  },
  checkYourAnswersPageBloodPressure: async ({ page }, use) => {
    await use(new BloodPressureCheckYourAnswersPage(page));
  },
  checkBloodPressurePage: async ({ page }, use) => {
    await use(new CheckBloodPressurePage(page));
  },
  confirmBloodPressureLocationPage: async ({ page }, use) => {
    await use(new ConfirmBloodPressureLocationPage(page));
  },
  confirmBloodPressureReadingsPage: async ({ page }, use) => {
    await use(new ConfirmBloodPressureReadingsPage(page));
  },
  enterYourReadingPage: async ({ page }, use) => {
    await use(new EnterYourReadingPage(page));
  },
  lowBloodPressureShutterPage: async ({ page }, use) => {
    await use(new LowBloodPressureShutterPage(page));
  },
  lowBloodPressureSymptomsPage: async ({ page }, use) => {
    await use(new LowBloodPressureSymptomsPage(page));
  },
  needBloodPressurePage: async ({ page }, use) => {
    await use(new NeedBloodPressurePage(page));
  },

  // Blood Tests

  orderBloodTestKitPage: async ({ page }, use) => {
    await use(new OrderBloodTestKitPage(page));
  },
  enterDeliveryAddressPage: async ({ page }, use) => {
    await use(new EnterDeliveryAddressPage(page));
  },
  enterPhoneNumberPage: async ({ page }, use) => {
    await use(new EnterPhoneNumberPage(page));
  },
  confirmDetailsPage: async ({ page }, use) => {
    await use(new ConfirmDetailsPage(page));
  },
  bloodTestOrderedPage: async ({ page }, use) => {
    await use(new BloodTestOrderedPage(page));
  },
  findDeliveryAddressPage: async ({ page }, use) => {
    await use(new FindDeliveryAddressPage(page));
  },
  needBloodTestPage: async ({ page }, use) => {
    await use(new NeedBloodTestPage(page));
  },
  noAddressFoundPage: async ({ page }, use) => {
    await use(new NoAddressFoundPage(page));
  },
  selectDeliveryAddressPage: async ({ page }, use) => {
    await use(new SelectDeliveryAddressPage(page));
  },

  // Physical Activity

  hoursExercisedPage: async ({ page }, use) => {
    await use(new HoursExercisedPage(page));
  },
  hoursWalkedPage: async ({ page }, use) => {
    await use(new HoursWalkedPage(page));
  },
  hoursCycledPage: async ({ page }, use) => {
    await use(new HoursCycledPage(page));
  },
  workActivityPage: async ({ page }, use) => {
    await use(new WorkActivityPage(page));
  },
  hoursHouseworkPage: async ({ page }, use) => {
    await use(new HoursHouseworkPage(page));
  },
  hoursGardeningPage: async ({ page }, use) => {
    await use(new HoursGardeningPage(page));
  },
  checkYourAnswersPhysicalActivityPage: async ({ page }, use) => {
    await use(new PhysicalActivityCheckYourAnswersPage(page));
  },
  walkingPacePage: async ({ page }, use) => {
    await use(new WalkingPacePage(page));
  },

  // Eligibility Pages

  contactYourGPSurgeryAboutYourNHSHealthCheckPage: async ({ page }, use) => {
    await use(new ContactYourGPSurgeryAboutYourNHSHealthCheckPage(page));
  },
  haveYouCompletedNhsHealthCheckPage: async ({ page }, use) => {
    await use(new HaveYouCompletedNhsHealthCheckPage(page));
  },
  preExistingHealthConditionsNotEligiblePage: async ({ page }, use) => {
    await use(new PreExistingHealthConditionsNotEligiblePage(page));
  },
  preExistingHealthConditionsPage: async ({ page }, use) => {
    await use(new PreExistingHealthConditionsPage(page));
  },
  previousHealthCheckCompletedPage: async ({ page }, use) => {
    await use(new PreviousHealthCheckCompletedPage(page));
  },
  whoShouldNotUseThisOnlineServicePage: async ({ page }, use) => {
    await use(new WhoShouldNotUseThisOnlineServicePage(page));
  },

  // Body Measurements Pages
  checkYourAnswersPageBodyMeasurements: async ({ page }, use) => {
    await use(new BodyMeasurementsCheckYourAnswersPage(page));
  },
  diabetesShutterPage: async ({ page }, use) => {
    await use(new DiabetesShutterPage(page));
  },
  measureYourWaistPage: async ({ page }, use) => {
    await use(new MeasureYourWaistPage(page));
  },
  whatIsYourHeightPage: async ({ page }, use) => {
    await use(new WhatIsYourHeightPage(page));
  },
  whatIsYourWaistMeasurementPage: async ({ page }, use) => {
    await use(new WhatIsYourWaistMeasurementPage(page));
  },
  whatIsYourWeightPage: async ({ page }, use) => {
    await use(new WhatIsYourWeightPage(page));
  },

  // Review and Submit Pages

  checkYourAnswersReviewSubmitPage: async ({ page }, use) => {
    await use(new CheckYourAnswersReviewSubmitPage(page));
  },

  // Results Pages
  alcoholResultsPage: async ({ page }, use) => {
    await use(new AlcoholResultsPage(page));
  },
  bloodPressureResultsPage: async ({ page }, use) => {
    await use(new BloodPressureResultsPage(page));
  },
  bmiResultsPage: async ({ page }, use) => {
    await use(new BMIResultsPage(page));
  },
  cholesterolResultsPage: async ({ page }, use) => {
    await use(new CholesterolResultsPage(page));
  },
  diabetesResultsPage: async ({ page }, use) => {
    await use(new DiabetesResultsPage(page));
  },
  dementiaResultsPage: async ({ page }, use) => {
    await use(new DementiaResultsPage(page));
  },
  mainResultsPage: async ({ page }, use) => {
    await use(new MainResultsPage(page));
  },
  physicalActivityResultsPage: async ({ page }, use) => {
    await use(new PhysicalActivityResultsPage(page));
  },
  smokingResultsPage: async ({ page }, use) => {
    await use(new SmokingResultsPage(page));
  },
  // WAF Error Page
  wafErrorPage: async ({ page }, use) => {
    await use(new WafErrorPage(page));
  }
});
