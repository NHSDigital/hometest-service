const fs = require('node:fs');
const path = require('node:path');

const {
  APPS,
  CDK_APPS_ROOT,
  validateAllApps
} = require('./validate-single-env-config');

/**
 * runs validation for every unique environment
 *
 * usage: node validate-all-env-configs.js
 */

function findUniqueEnvironments() {
  const environments = new Set();

  for (const app of APPS) {
    const envDir = path.join(CDK_APPS_ROOT, app, 'env');

    if (fs.existsSync(envDir)) {
      const entries = fs.readdirSync(envDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          // check for files inside subdirectories
          const subDir = path.join(envDir, entry.name);
          const subEntries = fs.readdirSync(subDir);

          for (const subEntry of subEntries) {
            if (subEntry.endsWith('.env') && subEntry !== 'defaults.env') {
              // extract environment name from filename
              const envName = subEntry.replace('.env', '');
              environments.add(envName);
            }
          }
        } else if (entry.isFile() && entry.name.endsWith('.env')) {
          // handle root-level env files like prod.env
          if (
            entry.name !== 'defaults.env' &&
            entry.name !== 'poc.env' &&
            entry.name !== 'local-overrides.env'
          ) {
            const envName = entry.name.replace('.env', '');
            environments.add(envName);
          }
        }
      }
    }
  }

  return Array.from(environments).sort();
}

function validateAllEnvConfigs() {
  console.log('\n🔍 Validating all environment files...\n');

  const environments = findUniqueEnvironments();

  if (environments.length === 0) {
    console.log('❌ No environment files found');
    process.exit(1);
  }

  console.log(`Found ${environments.length} environment(s):`);

  const results = [];

  for (const env of environments) {
    const capturedLogs = [];

    const originalLog = console.log;
    const originalError = console.error;

    // overriding console to capture logs for better presentation
    console.log = (...args) => capturedLogs.push(args.join(' '));
    console.error = (...args) => capturedLogs.push(args.join(' '));

    const { totalErrors, totalWarnings, totalInfo } = validateAllApps(env);

    // restore console
    console.log = originalLog;
    console.error = originalError;

    results.push({
      environment: env,
      totalErrors,
      totalWarnings,
      totalInfo
    });

    if (totalErrors === 0 && totalWarnings === 0) {
      if (totalInfo > 0) {
        console.log(`ℹ️  ${env}`);
      } else {
        console.log(`✅ ${env}`);
      }
    } else {
      if (totalErrors > 0) {
        console.log(`❌ ${env}`);
      } else {
        console.log(`⚠️  ${env}`);
      }
    }

    // output the captured logs
    if (capturedLogs.length > 0) {
      capturedLogs.forEach((log) => console.log(`  ${log}`));
    }
  }

  console.log('\n\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));

  const valid = results.filter(
    (r) => r.totalErrors === 0 && r.totalWarnings === 0
  );
  const invalid = results.filter((r) => r.totalErrors > 0);
  const warnings = results.filter((r) => r.totalWarnings > 0);

  console.log(`✅ Valid: ${valid.length}`);
  console.log(`❌ Invalid: ${invalid.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);

  if (invalid.length > 0 || warnings.length > 0) {
    console.log('\nEnvironments with mismatches:');

    // combine invalid and warnings, removing duplicates
    const allIssues = [
      ...invalid,
      ...warnings.filter((w) => !invalid.includes(w))
    ];

    allIssues.forEach((r) => {
      const issues = [];
      if (r.totalErrors > 0) {
        issues.push(`${r.totalErrors} missing`);
      }
      if (r.totalWarnings > 0) {
        issues.push(`${r.totalWarnings} additional`);
      }
      console.log(`  • ${r.environment} (${issues.join(', ')})`);

      // show captured logs for this environment
      if (r.logs && r.logs.length > 0) {
        console.log(`\n    Detailed logs for ${r.environment}:`);
        r.logs.forEach((log) => console.log(`    ${log}`));
        console.log('');
      }
    });
    process.exit(1);
  } else {
    console.log('\n🎉 All environments match their registries');
    process.exit(0);
  }
}

validateAllEnvConfigs();
