function readNumber(value: string | undefined): number | undefined {
  const parsedNumber = Number(value);
  // If value cannot be parsed as number, then parsedNumber will be NaN
  return isNaN(parsedNumber) ? undefined : parsedNumber;
}
const homeTestingDataModelVersion =
  process.env.REACT_APP_HOME_TESTING_DATA_MODEL_VERSION ?? '';
const nhtVersion = process.env.REACT_APP_NHT_VERSION ?? '';
const dateOfManufacture = process.env.REACT_APP_MANUFACTURE_DATE ?? '';
const envName = process.env.REACT_APP_HOME_TESTING_ENVIRONMENT;
const backendApiEndpoint = process.env.REACT_APP_NHT_BACKEND_API_ENDPOINT;
const authSessionExpiryDurationMinutes =
  process.env.REACT_APP_AUTH_SESSION_EXPIRY_DURATION;

const timeBeforePromptInMinutes =
  process.env.REACT_APP_AUTH_SESSION_TIME_BEFORE_PROMPT;

const eventAuditMaxRetries = process.env.REACT_APP_EVENT_AUDIT_MAX_RETRIES;

const addressTextInputMaxLength =
  process.env.REACT_APP_ADDRESS_TEXT_INPUT_MAX_LENGTH;

const nhsLogin = {
  clientId: process.env.REACT_APP_NHS_LOGIN_CLIENT_ID ?? '',
  redirectUrl: process.env.REACT_APP_NHS_LOGIN_REDIRECT_URL ?? '',
  baseUrl: process.env.REACT_APP_NHS_LOGIN_BASE_URL ?? ''
};

const appMonitorId = process.env.REACT_APP_APP_MONITOR_ID ?? '';

const testAutoExpireAfterDays =
  readNumber(
    process.env.REACT_APP_TEST_AUTO_EXPIRE_AFTER_DAYS
  ) ?? 28;

const noLabResultAutoExpireAfterDays =
  readNumber(process.env.REACT_APP_NO_LAB_RESULT_AUTO_EXPIRE_AFTER_DAYS) ?? 90;

const giveFeedbackUrl = process.env.REACT_APP_GIVE_FEEDBACK_SURVEY_URL ?? '';

const termsAndConditionsVersion = process.env.REACT_APP_CURRENT_TERMS_VERSION;

const nhsAppUrl = process.env.REACT_APP_NHS_APP_URL;

export {
  homeTestingDataModelVersion,
  nhtVersion,
  dateOfManufacture,
  backendApiEndpoint,
  envName,
  eventAuditMaxRetries,
  nhsLogin,
  authSessionExpiryDurationMinutes,
  timeBeforePromptInMinutes,
  addressTextInputMaxLength,
  appMonitorId,
  testAutoExpireAfterDays,
  noLabResultAutoExpireAfterDays,
  giveFeedbackUrl,
  termsAndConditionsVersion,
  nhsAppUrl
};
