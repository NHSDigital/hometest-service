const fs = require('node:fs');
const path = require('node:path');

/**
 * compares environment configuration files against the config-registry.json
 * to detect missing or additional environment variables
 *
 * usage: node validate-single-env-config.js <environment>
 * example: node validate-single-env-config.js int
 */

const APPS = ['main', 'db', 'dev', 'security', 'shared'];
const CDK_APPS_ROOT = path.join(__dirname, '../../infra');

function conditionalLog(...args) {
  if (require.main === module) {
    console.log(...args);
  }
}

function loadJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    conditionalLog(`Error loading ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * extract based on matches for VARIABLE_NAME=value or VARIABLE_NAME="value"
 * ignores lines that start with # (including leading whitespace)
 */
function extractEnvVars(filePath, allVars) {
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const regex = /^(?!\s*#)\s*([A-Z_][A-Z0-9_]*)=/gm;

      let match;

      while ((match = regex.exec(content)) !== null) {
        const varName = match[1];
        // uncomment to debug variable extraction
        // console.log(`Found variable: ${varName}`);
        allVars.add(varName);
      }
    } catch (error) {
      conditionalLog(`Error reading ${filePath}: ${error.message}`);
      return [];
    }
  }
}

/**
 * load and merge environment variables following
 *
 * 'poc' environment:
 *   1. defaults.env
 *   2. poc/defaults.env
 *   3. poc/<env>.env
 *
 * other environments (int, test, prod):
 *   1. defaults.env
 *   2. <env>/<env>.env
 */
function loadEnvVars(appName, environment) {
  const awsAccount = isPocEnv(environment) ? 'poc' : environment;

  const rootDir = path.join(CDK_APPS_ROOT, appName);
  const envDir = path.join(rootDir, 'env');

  const allVars = new Set();

  // load defaults.env
  const defaultsPath = path.join(envDir, 'defaults.env');
  conditionalLog(`Loading variables from ${defaultsPath}`);
  extractEnvVars(defaultsPath, allVars);

  // try load poc/defaults.env
  if (awsAccount === 'poc') {
    const pocDefaultsPath = path.join(envDir, awsAccount, 'defaults.env');
    conditionalLog(`Loading variables from ${pocDefaultsPath}`);
    extractEnvVars(pocDefaultsPath, allVars);
  }

  // load the specific environment file
  const possiblePaths = [
    path.join(envDir, awsAccount, `${environment}.env`),
    path.join(envDir, `${awsAccount}.env`) // e.g., env/poc.env or env/int.env (for shared/security app)
  ];

  let envFilePath = null;

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      envFilePath = filePath;
      conditionalLog(`Loading variables from ${filePath}`);
      extractEnvVars(filePath, allVars);
      break;
    }
  }

  return {
    allVars: Array.from(allVars).sort(),
    envFilePath
  };
}

function isPocEnv(environment) {
  const nonPocEnvs = ['int', 'test', 'prod'];
  return !nonPocEnvs.includes(environment);
}

function isVariableRequired(varConfig, environment) {
  const requiredScope = varConfig.scope;

  if (!requiredScope) {
    // by default, variable is required in all environments
    // unless specified otherwise
    return true;
  }

  const isPoc = isPocEnv(environment);
  const isProd = environment === 'prod';

  switch (requiredScope) {
    case 'poc':
      return isPoc;
    case 'non-poc':
      return !isPoc;
    case 'non-prod':
      return !isProd;
    case 'prod':
      return isProd;
    default:
      throw new Error(`Unknown scope '${requiredScope}' in variable config`);
  }
}

function validateAppConfig(appName, environment) {
  const registryPath = path.join(
    CDK_APPS_ROOT,
    appName,
    'config-registry.json'
  );

  if (!fs.existsSync(registryPath)) {
    conditionalLog(`  ⚠️  No config-registry.json found`);
    return { hasErrors: false, warnings: 0, info: 0, skipped: true };
  }

  const registry = loadJsonFile(registryPath);
  if (!registry) {
    return { hasErrors: true, warnings: 0, info: 0, skipped: false };
  }

  const { allVars, envFilePath } = loadEnvVars(appName, environment);

  if (!envFilePath) {
    // still validate for security resources are split prod/non-prod
    if (['security', 'dev'].includes(appName) && allVars.length > 0) {
      conditionalLog(
        `  ℹ️  No ${environment}.env file found, using defaults.env only`
      );
    } else {
      conditionalLog(`  ⚠️  No ${environment}.env file found`);
    }
  }

  const declaredVars = new Set(allVars);
  const registryVars = new Set(Object.keys(registry.variables));

  // find variables in registry that are required but not in env files
  const missingVars = [...registryVars].filter((varName) => {
    const varConfig = registry.variables[varName];
    return (
      isVariableRequired(varConfig, environment) && !declaredVars.has(varName)
    );
  });

  // find additional variables in env file but not in registry
  const additionalVars = [...declaredVars].filter((v) => !registryVars.has(v));

  // find variables that are included but not required for this environment
  const notRequiredButIncluded = [...declaredVars].filter((varName) => {
    const varConfig = registry.variables[varName];
    return varConfig && !isVariableRequired(varConfig, environment);
  });

  if (
    missingVars.length === 0 &&
    additionalVars.length === 0 &&
    notRequiredButIncluded.length === 0
  ) {
    conditionalLog('  ✅  Environment configuration matches registry');
    return { hasErrors: false, warnings: 0, info: 0, skipped: false };
  }

  let hasErrors = false;
  let warnings = 0;
  let info = 0;

  if (missingVars.length > 0) {
    console.log(`  ❌  Missing variables (${missingVars.length}):`);

    for (const v of missingVars) {
      const varInfo = registry.variables[v];
      console.log(`    ‣ ${v}`);
      if (varInfo?.description) {
        conditionalLog(`\t${varInfo.description}`);
      }
    }
    hasErrors = true;
  }

  if (additionalVars.length > 0) {
    console.log(
      `  ⚠️  Additional variables not in registry (${additionalVars.length}):`
    );
    for (const v of additionalVars) {
      console.log(`    ‣ ${v}`);
    }
    warnings += additionalVars.length;
  }

  if (notRequiredButIncluded.length > 0) {
    console.log(
      `  ℹ️  Variables not required but included (${notRequiredButIncluded.length}):`
    );
    for (const v of notRequiredButIncluded) {
      const varInfo = registry.variables[v];
      console.log(`    ‣ ${v} (scope: ${varInfo.scope || 'all'})`);
      if (varInfo?.description) {
        conditionalLog(`\t${varInfo.description}`);
      }
    }
    info += notRequiredButIncluded.length;
  }

  return { hasErrors, warnings, info, skipped: false };
}

function validateAllApps(environment) {
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalInfo = 0;
  let skippedApps = [];

  for (const app of APPS) {
    if (environment === 'prod' && app === 'dev') {
      conditionalLog('\n⏭️  Skipped dev check (not deployed in production)');
      skippedApps.push(app);
      continue;
    }

    conditionalLog(`\n🖥️  ${app}`);

    const { hasErrors, warnings, info, skipped } = validateAppConfig(
      app,
      environment
    );

    if (hasErrors) {
      totalErrors++;
    }

    totalWarnings += warnings;
    totalInfo += info;

    if (skipped) {
      skippedApps.push(app);
    }
  }

  return { totalErrors, totalWarnings, totalInfo, skippedApps };
}

function validateSingleEnvConfig() {
  const args = process.argv.slice(2);
  const environment = args[0];

  if (!environment) {
    console.error('error: specify an environment');
    console.error('usage: node validate-single-env-config.js <environment>');
    console.error('example: node validate-single-env-config.js int');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(50));
  console.log(`ENV: ${environment}`);
  console.log(`APPS: ${APPS.join(', ')}`);
  console.log('='.repeat(50));

  const { totalErrors, totalWarnings, totalInfo, skippedApps } =
    validateAllApps(environment);

  console.log('\n' + '='.repeat(50));
  console.log('📊  Summary');
  console.log('='.repeat(50));

  const checkedApps = APPS.length - skippedApps.length;
  console.log(`Apps checked: ${checkedApps}/${APPS.length}`);
  if (skippedApps.length > 0) {
    console.log(`Apps skipped: ${skippedApps.join(', ')}`);
  }

  if (totalErrors > 0) {
    console.log(`❌ ${totalErrors} app(s) with missing variables`);
  }
  if (totalWarnings > 0) {
    console.log(`⚠️  ${totalWarnings} additional variable(s) not in registry`);
  }
  if (totalInfo > 0) {
    console.log(`ℹ️  ${totalInfo} variable(s) included but not required`);
  }

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('✅  All configurations match their registries');
    process.exit(0);
  } else {
    console.log(
      '\n💡 Update config-registry.json files to match your environment configurations'
    );

    process.exit(totalErrors > 0 ? 1 : 0);
  }
}

// export for use in other scripts
module.exports = { APPS, CDK_APPS_ROOT, validateAllApps };

// run if executed directly
if (require.main === module) {
  validateSingleEnvConfig();
}
