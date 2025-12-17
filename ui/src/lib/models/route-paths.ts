export enum RoutePath {
  StartHealthCheckPage = '/start',
  TaskListPage = '/task-list',
  EligibilityJourney = '/eligibility',
  NotEligiblePage = '/not-eligible',
  OdsNhsNumberNotEligiblePage = '/ods-nhs-eligibility-exit',
  HealthCheckExpiredPage = '/data-expired-exit',
  BloodTestDataExpiredShutterPage = '/no-test-result-data-expired',
  BloodPressureJourney = '/blood-pressure',
  AboutYouJourney = '/about-you',
  AlcoholConsumptionJourney = '/alcohol-consumption',
  PhysicalActivityJourney = '/physical-activity',
  BodyMeasurementsJourney = '/body-measurements',
  BloodTestJourney = '/blood-test',
  TermsAndConditions = '/terms-conditions',
  HealthCheckVersionMigration = '/healthcheck-incomplete',
  SingleSignOnPage = '/sso',
  HomePage = '/',
  LoginCallbackPage = '/login-callback',
  LogoutPage = '/logged-out',
  SessionTimedOutPage = '/session-timed-out',
  UnexpectedErrorPage = '/error',
  MainResultsPage = '/results-summary',
  BMIResultsPage = '/bmi-results',
  BloodPressureResultsPage = '/blood-pressure-level',
  DiabetesRiskResultsPage = '/diabetes-risk-result',
  CholesterolResultsPage = '/cholesterol-risk-result',
  AlcoholResultsPage = '/alcohol-risk-results',
  SmokingResultsPage = '/smoking-results',
  PhysicalActivityResultsPage = '/physical-activity-level',
  CheckAndSubmitYourAnswersPage = '/check-answers-final',
  ConsentNotGivenErrorPage = '/nhs-login-consent-declined',
  NhsLoginErrorPage = '/nhs-login-error',
  DementiaPage = '/dementia',
  AboutThisSoftwarePage = '/about-this-software'
}

export enum JourneyStepNames {
  // Eligibility Journey
  ReceivedInvitationQueryPage = 'received-invitation',
  PreexistingHealthConditionsPage = 'pre-existing-health-conditions',
  PreviousHealthCheckCompletedQueryPage = 'five-year-eligibility',
  WhoShouldNotUseOnlineServicePage = 'who-should-not-use-this-service',
  ExtendedExclusionsShutterPage = 'contact-your-gp-conditions',
  SorryCannotGetHealthCheckWithPreviousHealthcheckCompleted = 'five-year-eligibility-exit',
  SorryCannotGetHealthCheckWithPreexistingConditionPage = 'pre-existing-health-conditions-exit',

  // About You Journey
  TownsendPostcodePage = 'enter-your-postcode',
  ParentSiblingHeartAttackPage = 'family-history-angina',
  ParentSiblingChildDiabetesPage = 'family-history-diabetes',
  SexAssignedAtBirthPage = 'sex-assigned-at-birth',
  EthnicGroupPage = 'ethnic-group',
  DescribeEthnicBackgroundPage = 'ethnic-background-details',
  SmokingQuestionPage = 'do-you-smoke',
  LupusPage = 'lupus-diagnosis',
  SevereMentalIllness = 'mental-health-diagnosis',
  AtypicalAntipsychoticMedication = 'atypical-antipsychotic-medicine',
  Migraines = 'migraines',
  ErectileDysfunction = 'erectile-dysfunction',
  SteroidTablets = 'corticosteroid-medication',
  RheumatoidArthritis = 'rheumatoid-arthritis-diagnosis',

  CheckYourAnswersAboutYouPage = 'check-answers-about-you',

  // Blood Pressure Journey
  BloodPressureCheckPage = 'check-blood-pressure',
  BloodPressureLocationPage = 'blood-pressure-location',
  EnterBloodPressurePage = 'enter-blood-pressure-reading',
  BloodPressureVeryHighShutterPage = 'very-high-blood-pressure',
  NeedBloodPressurePage = 'blood-pressure-reading-needed',
  ConfirmBloodPressurePage = 'check-answers-blood-pressure',
  ConfirmBloodPressureReadingPage = 'confirm-blood-pressure',
  LowBloodPressureSymptomsPage = 'low-blood-pressure-symptoms',
  LowBloodPressureShutterPage = 'low-blood-pressure-shutter',

  // Alcohol Consumption Journey
  AlcoholQuestionPage = 'do-you-drink-alcohol',
  AlcoholOftenPage = 'alcohol-frequency',
  AlcoholTypicalUnitsPage = 'alcohol-typical-units',
  AlcoholOccasionUnitsPage = 'alcohol-single-occasion',
  AlcoholStopPage = 'alcohol-unable-to-stop',
  AlcoholFailPage = 'alcohol-failure-expectations',
  AlcoholMorningDrinkPage = 'alcohol-morning-drinking',
  AlcoholGuiltPage = 'alcohol-guilt',
  AlcoholMemoryLossPage = 'alcohol-memory-loss',
  AlcoholPersonInjuredPage = 'alcohol-injury',
  AlcoholConcernedRelativePage = 'alcohol-concerned',
  CheckYourAnswersAlcoholPage = 'check-answers-alcohol',

  // Blood Test Journey
  BloodTestDeclarationPage = 'order-blood-test-kit',
  EnterAddressPage = 'enter-delivery-address',
  EnterPhoneNumberPage = 'enter-phone-number',
  NeedBloodTestPage = 'contact-your-gp-blood-test',
  ConfirmDetailsPage = 'confirm-details',
  BloodTestOrderedPage = 'blood-test-kit-ordered',
  FindAddressPage = 'find-delivery-address',
  ProblemFindingAddressPage = 'error-address',
  SelectAddressPage = 'select-address',
  NoAddressFoundPage = 'no-address-found',

  // Body Measurements Journey
  HeightPage = 'height',
  WeightPage = 'weight',
  MeasureYourWaistPage = 'measure-waist',
  WaistMeasurementPage = 'enter-waist-measurement',
  DiabetesShutterPage = 'diabetes-risk-exit',
  CheckYourAnswersBodyMeasurementsPage = 'check-answers-body-measurements',

  // Physical Activity Journey
  HoursExercisedPage = 'exercise-hours',
  HoursWalkedPage = 'walk-hours',
  HoursCycledPage = 'cycle-hours',
  WorkActivityPage = 'work',
  EverydayMovementPage = 'everyday-movement',
  HoursHouseworkPage = 'housework-childcare-hours',
  HoursGardeningPage = 'gardening-diy-hours',
  WalkingPacePage = 'walking-pace',
  CheckYourAnswersPagePhysicalActivity = 'check-answers-physical-activity'
}

type PageTitlesMap = {
  [K in RoutePath | JourneyStepNames]: string;
};

// The page titles map need to include titles for all pages in the app
// including those accessible via specific path (based on route path value)
// as well as those accessible via specific step name (based on journey step name value)
// The titles should be in line with those defined on the Confluence page:
// https://nhsd-confluence.digital.nhs.uk/pages/viewpage.action?spaceKey=DHC&title=Page+titles+and+URLs
// In case when the title is not defined on the Confluence page please contact the Content Team
export const pageTitlesMap: PageTitlesMap = {
  [RoutePath.HomePage]: 'Get your NHS Health Check online',
  [RoutePath.StartHealthCheckPage]: 'Get your NHS Health Check online',
  [RoutePath.AboutThisSoftwarePage]: 'About this software',
  [RoutePath.TaskListPage]: 'NHS Health Check task list',
  [RoutePath.NotEligiblePage]: 'Sorry, you cannot get an NHS Health Check',
  [RoutePath.OdsNhsNumberNotEligiblePage]:
    'You cannot complete an NHS Health Check online',
  [RoutePath.HealthCheckExpiredPage]:
    'Your NHS Health Check online has expired',
  [RoutePath.BloodTestDataExpiredShutterPage]:
    'Contact your GP surgery to complete your NHS Health Check',
  [RoutePath.ConsentNotGivenErrorPage]:
    'You cannot complete an NHS Health Check online',
  [RoutePath.TermsAndConditions]: 'Terms and conditions',
  [RoutePath.HealthCheckVersionMigration]:
    'Your NHS Health Check online is incomplete',
  [RoutePath.SessionTimedOutPage]: "For security, we've logged you out",
  [RoutePath.LogoutPage]: 'You have logged out',
  [RoutePath.CheckAndSubmitYourAnswersPage]:
    'Check your answers before you submit them',
  [RoutePath.SingleSignOnPage]: 'Signing in',
  [RoutePath.LoginCallbackPage]: 'Login redirect',
  [RoutePath.UnexpectedErrorPage]: 'Unexpected error',
  [RoutePath.NhsLoginErrorPage]: 'NHS login error',
  [RoutePath.MainResultsPage]: 'Your results summary',
  [RoutePath.BMIResultsPage]: 'Your BMI result',
  [RoutePath.BloodPressureResultsPage]: 'Your blood pressure level',
  [RoutePath.DiabetesRiskResultsPage]: 'Your diabetes risk result',
  [RoutePath.CholesterolResultsPage]: 'Your cholesterol level',
  [RoutePath.DementiaPage]: 'Dementia',
  [RoutePath.AlcoholResultsPage]: 'Alcohol risk results',
  [RoutePath.SmokingResultsPage]: 'Your smoking results',
  [RoutePath.PhysicalActivityResultsPage]: 'Your physical activity level',

  [JourneyStepNames.ReceivedInvitationQueryPage]:
    'Did you receive an invitation from your GP surgery to do the NHS Health Check online?',
  [JourneyStepNames.PreexistingHealthConditionsPage]:
    'Pre-existing health conditions',
  [JourneyStepNames.PreviousHealthCheckCompletedQueryPage]:
    'Have you completed an NHS Health Check in the last 5 years?',
  [JourneyStepNames.WhoShouldNotUseOnlineServicePage]:
    'Who should not use this online service',
  [JourneyStepNames.SorryCannotGetHealthCheckWithPreviousHealthcheckCompleted]:
    'You have had an NHS Health Check in the last five years',
  [JourneyStepNames.SorryCannotGetHealthCheckWithPreexistingConditionPage]:
    'You have a pre-existing condition',
  [JourneyStepNames.ExtendedExclusionsShutterPage]:
    'Book a face-to-face appointment with your GP surgery',

  [JourneyStepNames.TownsendPostcodePage]: 'Enter your postcode',
  [JourneyStepNames.ParentSiblingHeartAttackPage]:
    'Family history of heart attacks or angina',
  [JourneyStepNames.ParentSiblingChildDiabetesPage]:
    'Family history of diabetes',
  [JourneyStepNames.SexAssignedAtBirthPage]:
    'What is your sex assigned at birth?',
  [JourneyStepNames.EthnicGroupPage]: 'What is your ethnic group?',
  [JourneyStepNames.DescribeEthnicBackgroundPage]:
    'Provide details of your ethnic background',
  [JourneyStepNames.SmokingQuestionPage]: 'Do you smoke?',
  [JourneyStepNames.LupusPage]: 'Have you been diagnosed with lupus?',
  [JourneyStepNames.SevereMentalIllness]:
    'Have you been diagnosed with a severe mental health condition?',
  [JourneyStepNames.AtypicalAntipsychoticMedication]:
    'Atypical antipsychotic medication',
  [JourneyStepNames.Migraines]: 'Do you get migraines?',
  [JourneyStepNames.ErectileDysfunction]:
    'Do you experience erectile dysfunction?',
  [JourneyStepNames.SteroidTablets]: 'Steroid tablets',
  [JourneyStepNames.RheumatoidArthritis]:
    'Have you been diagnosed with rheumatoid arthritis?',
  [JourneyStepNames.CheckYourAnswersAboutYouPage]:
    'Check your answers for About you',

  [JourneyStepNames.BloodPressureCheckPage]: 'Check your blood pressure',
  [JourneyStepNames.BloodPressureLocationPage]:
    'Confirm where you will get a blood pressure reading',
  [JourneyStepNames.EnterBloodPressurePage]: 'Enter blood pressure reading',
  [JourneyStepNames.BloodPressureVeryHighShutterPage]:
    'You have very high blood pressure',
  [JourneyStepNames.NeedBloodPressurePage]:
    'We need your blood pressure reading to continue',
  [JourneyStepNames.ConfirmBloodPressurePage]:
    'Check your answers for Blood pressure',
  [JourneyStepNames.ConfirmBloodPressureReadingPage]:
    'Confirm your blood pressure reading',
  [JourneyStepNames.LowBloodPressureSymptomsPage]:
    'Do you have symptoms of fainting',
  [JourneyStepNames.LowBloodPressureShutterPage]:
    'You cannot complete your NHS Health Check online',

  [JourneyStepNames.AlcoholQuestionPage]: 'Do you drink alcohol?',
  [JourneyStepNames.AlcoholOftenPage]:
    'How often do you have a drink containing alcohol?',
  [JourneyStepNames.AlcoholTypicalUnitsPage]:
    'How many units do you drink on a typical day?',
  [JourneyStepNames.AlcoholOccasionUnitsPage]:
    'How often do you exceed recommended units on a single occasion?',
  [JourneyStepNames.AlcoholStopPage]:
    'Do you struggle to stop drinking once you start?',
  [JourneyStepNames.AlcoholFailPage]:
    "Does drinking stop you from doing what's expected of you?",
  [JourneyStepNames.AlcoholMorningDrinkPage]:
    'Do you need a drink in the morning after a heavy session?',
  [JourneyStepNames.AlcoholGuiltPage]:
    'How often have you felt guilty or remorseful after drinking?',
  [JourneyStepNames.AlcoholMemoryLossPage]:
    'Do you struggle to remember what happens when you drink?',
  [JourneyStepNames.AlcoholPersonInjuredPage]:
    'Have you or someone else been injured because of your drinking?',
  [JourneyStepNames.AlcoholConcernedRelativePage]:
    'Is someone you know concerned about your drinking?',
  [JourneyStepNames.CheckYourAnswersAlcoholPage]:
    'Check your answers for Alcohol consumption',

  [JourneyStepNames.BloodTestDeclarationPage]: 'Order a blood test kit',
  [JourneyStepNames.EnterAddressPage]: 'Enter your delivery address',
  [JourneyStepNames.FindAddressPage]: 'Find your delivery address',
  [JourneyStepNames.NeedBloodTestPage]:
    'Contact your GP surgery to complete your NHS Health Check',
  [JourneyStepNames.EnterPhoneNumberPage]: 'Enter Phone Number',
  [JourneyStepNames.ConfirmDetailsPage]: 'Confirm your details',
  [JourneyStepNames.BloodTestOrderedPage]: 'Blood test kit ordered',
  [JourneyStepNames.ProblemFindingAddressPage]:
    'There was a problem finding your delivery address',
  [JourneyStepNames.SelectAddressPage]: 'Select your delivery address',
  [JourneyStepNames.NoAddressFoundPage]: 'No address found',

  [JourneyStepNames.HeightPage]: 'What is your height?',
  [JourneyStepNames.WeightPage]: 'What is your weight?',
  [JourneyStepNames.MeasureYourWaistPage]: 'Measure your waist',
  [JourneyStepNames.WaistMeasurementPage]: 'Enter your waist measurement',
  [JourneyStepNames.DiabetesShutterPage]:
    'You may be at risk of type 2 diabetes',
  [JourneyStepNames.CheckYourAnswersBodyMeasurementsPage]:
    'Check your answers for body measurements',

  [JourneyStepNames.HoursExercisedPage]:
    'How many hours do you exercise in a typical week?',
  [JourneyStepNames.HoursWalkedPage]:
    'How many hours do you walk in a typical week?',
  [JourneyStepNames.HoursCycledPage]:
    'How many hours do you cycle in a typical week?',
  [JourneyStepNames.WorkActivityPage]: 'How active are you in your work?',
  [JourneyStepNames.EverydayMovementPage]: 'Everyday movement',
  [JourneyStepNames.HoursHouseworkPage]:
    'How many hours do you spend on housework or childcare in a typical week? (optional)',
  [JourneyStepNames.HoursGardeningPage]:
    'How many hours do you spend on gardening or DIY in a typical week? (optional)',
  [JourneyStepNames.WalkingPacePage]:
    'How would you describe your usual walking pace? (optional)',
  [JourneyStepNames.CheckYourAnswersPagePhysicalActivity]:
    'Check your answers for Physical activity',

  // these are not used as the step value takes precedence
  [RoutePath.EligibilityJourney]: '',
  [RoutePath.BloodPressureJourney]: '',
  [RoutePath.AboutYouJourney]: '',
  [RoutePath.AlcoholConsumptionJourney]: '',
  [RoutePath.PhysicalActivityJourney]: '',
  [RoutePath.BodyMeasurementsJourney]: '',
  [RoutePath.BloodTestJourney]: ''
};

export const RoutesWithoutSessionTimer: RoutePath[] = [
  RoutePath.HomePage,
  RoutePath.LoginCallbackPage,
  RoutePath.LogoutPage,
  RoutePath.SessionTimedOutPage,
  RoutePath.SingleSignOnPage,
  RoutePath.NotEligiblePage,
  RoutePath.ConsentNotGivenErrorPage,
  RoutePath.NhsLoginErrorPage,
  RoutePath.UnexpectedErrorPage,
  RoutePath.DementiaPage
];

const pagesToHideLogoutButton = [
  RoutePath.HomePage,
  RoutePath.LoginCallbackPage,
  RoutePath.LogoutPage,
  RoutePath.SessionTimedOutPage,
  RoutePath.SingleSignOnPage,
  RoutePath.NotEligiblePage,
  RoutePath.ConsentNotGivenErrorPage,
  RoutePath.NhsLoginErrorPage
];

export function isSessionHandlingRequiredForPage(path: string) {
  const routePath = getRoutePath(path);
  return routePath !== undefined
    ? !isRouteIncludedInArray(RoutesWithoutSessionTimer, routePath)
    : false;
}

export function isLogoutButtonRequiredForPage(path: string) {
  const routePath = getRoutePath(path);
  return routePath !== undefined
    ? !isRouteIncludedInArray(pagesToHideLogoutButton, routePath)
    : false;
}

function isRouteIncludedInArray(array: RoutePath[], routePath: RoutePath) {
  return Object.values(array).includes(routePath);
}

export function getRoutePath(value: string): RoutePath | undefined {
  return Object.values(RoutePath).includes(value as RoutePath)
    ? (value as RoutePath)
    : undefined;
}

export function getStepUrl(pageUrl: string, stepName: string | null) {
  return stepName ? `${pageUrl}?step=${stepName}` : pageUrl;
}
