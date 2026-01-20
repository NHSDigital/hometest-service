import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Global teardown started');
  console.log(`Completed tests in ${config.projects.length} project(s)`);
  
  // Add any global teardown logic here
  // Example: stop test server, close database connections, cleanup resources, etc.
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;
