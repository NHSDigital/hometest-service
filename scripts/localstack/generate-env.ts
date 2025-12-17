/**
 * Generate UI environment file from LocalStack CDK outputs
 * Run with: npx tsx scripts/localstack/generate-env.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const OUTPUTS_DIR = path.join(__dirname, 'outputs');
const ENV_OUTPUT_PATH = path.join(__dirname, '../../ui/env/localstack/localstack.env');

interface StackOutputs {
  [key: string]: string;
}

function loadOutputs(filename: string): StackOutputs {
  const filepath = path.join(OUTPUTS_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`⚠️ Output file not found: ${filepath}`);
    return {};
  }
  const content = fs.readFileSync(filepath, 'utf-8');
  const data = JSON.parse(content);

  // Flatten nested stack outputs
  const outputs: StackOutputs = {};
  for (const stackName of Object.keys(data)) {
    for (const [key, value] of Object.entries(data[stackName])) {
      outputs[key] = value as string;
    }
  }
  return outputs;
}

function generateEnvFile(): void {
  console.log('🔧 Generating LocalStack UI environment file...\n');

  // Load all stack outputs
  const dbOutputs = loadOutputs('db-outputs.json');
  const devOutputs = loadOutputs('dev-outputs.json');
  const mainOutputs = loadOutputs('main-outputs.json');

  const allOutputs = { ...dbOutputs, ...devOutputs, ...mainOutputs };

  // Find API Gateway URLs from outputs
  const backendApiUrl = Object.entries(allOutputs).find(([k]) =>
    k.toLowerCase().includes('apiurl') || k.toLowerCase().includes('apiendpoint')
  )?.[1] || 'http://localhost:4566/restapis/local/local/_user_request_';

  const mockApiUrl = Object.entries(allOutputs).find(([k]) =>
    k.toLowerCase().includes('mock') && k.toLowerCase().includes('url')
  )?.[1] || 'http://localhost:4566/restapis/mock/local/_user_request_';

  // Generate environment file content
  const envContent = `# LocalStack environment configuration
# Auto-generated from CDK stack outputs
# Do not edit manually - regenerate with: npm run localstack:env

REACT_APP_HOME_TESTING_ENVIRONMENT="localstack"
REACT_APP_NHT_BACKEND_API_ENDPOINT="${backendApiUrl}"
REACT_APP_EVENT_AUDIT_MAX_RETRIES=2
REACT_APP_AUTH_SESSION_EXPIRY_DURATION=10
REACT_APP_AUTH_SESSION_TIME_BEFORE_PROMPT=1
REACT_APP_ADDRESS_TEXT_INPUT_MAX_LENGTH=35
REACT_APP_TEST_AUTO_EXPIRE_AFTER_DAYS=28
REACT_APP_NO_LAB_RESULT_AUTO_EXPIRE_AFTER_DAYS=90
REACT_APP_GIVE_FEEDBACK_SURVEY_URL="https://feedback.digital.nhs.uk/jfe/form/SV_6Woany6ROnmYwui"

# NHS Login - pointing to LocalStack mock
REACT_APP_NHS_LOGIN_CLIENT_ID="localstack-dev"
REACT_APP_NHS_LOGIN_REDIRECT_URL="https://localhost:3000/login-callback"
REACT_APP_NHS_LOGIN_BASE_URL="${mockApiUrl}/nhs-login"
REACT_APP_NHS_APP_URL="${mockApiUrl}/nhs-app"

# App versions
REACT_APP_NHT_VERSION="2.0.0-localstack"
REACT_APP_CURRENT_TERMS_VERSION="1.0"
REACT_APP_MANUFACTURE_DATE="01/01/2025"
REACT_APP_HOME_TESTING_DATA_MODEL_VERSION="3.0.0"

# RUM disabled for localstack
REACT_APP_APP_MONITOR_ID=""

# LocalStack specific
REACT_APP_AWS_ENDPOINT="http://localhost:4566"
`;

  // Ensure directory exists
  const envDir = path.dirname(ENV_OUTPUT_PATH);
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
  }

  fs.writeFileSync(ENV_OUTPUT_PATH, envContent);
  console.log(`✅ Environment file generated: ${ENV_OUTPUT_PATH}`);

  // Print summary
  console.log('\n📋 Configuration summary:');
  console.log(`   Backend API: ${backendApiUrl}`);
  console.log(`   Mock API: ${mockApiUrl}`);
}

generateEnvFile();
