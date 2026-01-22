import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Global setup started');
  console.log(`Running tests in ${config.projects.length} project(s)`);
  console.log('Environment:', process.env.NODE_ENV || 'default');

  // Add any global setup logic here
  // Example: start a test server, set up database connections, etc.

  console.log('✅ Global setup completed');
}

export default globalSetup;
